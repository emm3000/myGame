import { ApiErrorSchema, PlayerSchema } from '@mygame/contracts'
import { ok } from '@mygame/domain'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../../app'
import { type ComposedServer, composeServer } from '../../../composeServer'
import { mailEnvironment } from '../../../composeServer.testSupport'
import type { ComposedStores } from '../../../composeStores'
import type { Transaction } from '../../../platform/application/ports/Transaction'
import { accountTokenExpiryFrom } from '../../application/accountTokenExpiryFrom'
import type { Mail } from '../../application/ports/Mailer'
import { MemoryMailer } from '../memory/MemoryMailer'
import {
  anasSignUp,
  contentDirectory,
  databaseUrl,
  emailVerifiedAtOf,
  type MovableClock,
  movableClock,
  playersWithEmail,
  post,
  sessionCookieOf,
  signedUpAt,
  storedResetTokens,
  storedSessionKeys,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the auth routes', () => {
  let server: ComposedServer
  let clock: MovableClock
  let mailer: MemoryMailer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await truncateAccounts()
    clock = movableClock()
    mailer = new MemoryMailer()
    app = createApp({ ...server, clock, mailer })
  })

  const signUpAna = async (): Promise<Response> => app.request('/auth/sign-up', post(anasSignUp))

  const sessionOf = async (cookie: string): Promise<Response> =>
    app.request('/auth/session', { headers: { cookie } })

  const verifyEmail = async (token: string): Promise<Response> =>
    app.request('/auth/verify-email', post({ token }))

  const resendFor = async (cookie: string, resendingApp = app): Promise<Response> =>
    resendingApp.request('/auth/verify-email/resend', post({}, cookie))

  const isEmailVerified = async (cookie: string): Promise<boolean> =>
    PlayerSchema.parse(await (await sessionOf(cookie)).json()).emailVerified

  it('sends the verification mail to a new player', async () => {
    await signUpAna()

    const sent = mailer.sentTo(anasSignUp.email)
    expect(sent).toHaveLength(1)
    expect(tokenOf(sent[0])).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('signs up a player whose email is not verified', async () => {
    const response = await signUpAna()

    expect(PlayerSchema.parse(await response.json()).emailVerified).toBe(false)
    expect(await isEmailVerified(sessionCookieOf(response))).toBe(false)
  })

  it('signs up even when the mail cannot be sent', async () => {
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const response = await failingApp.request('/auth/sign-up', post(anasSignUp))

    expect(response.status).toBe(201)
    expect(await playersWithEmail(anasSignUp.email)).toBe(1)
  })

  it('verifies the email the link was sent to', async () => {
    const cookie = sessionCookieOf(await signUpAna())

    const verified = await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))

    expect(verified.status).toBe(204)
    expect(await isEmailVerified(cookie)).toBe(true)
    const signedIn = await app.request(
      '/auth/sign-in',
      post({ email: anasSignUp.email, password: anasSignUp.password }),
    )
    expect(PlayerSchema.parse(await signedIn.json()).emailVerified).toBe(true)
  })

  it('accepts a verify link used earlier in its day', async () => {
    await signUpAna()
    const token = tokenOf(mailer.sentTo(anasSignUp.email)[0])
    await verifyEmail(token)
    clock.advanceHours(1)

    const second = await verifyEmail(token)

    expect(second.status).toBe(204)
  })

  it('keeps the first verified instant when a verify link is used again', async () => {
    await signUpAna()
    const token = tokenOf(mailer.sentTo(anasSignUp.email)[0])
    await verifyEmail(token)
    clock.advanceHours(1)

    await verifyEmail(token)

    expect(await emailVerifiedAtOf(anasSignUp.email)).toBe(signedUpAt)
  })

  it('refuses a verify link past its day', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    clock.advanceDays(1)

    const response = await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('TokenInvalid')
    expect(await isEmailVerified(cookie)).toBe(false)
  })

  it('refuses a reset token as a verify link', async () => {
    const player = PlayerSchema.parse(await (await signUpAna()).json())
    const resetToken = 'a-reset-token-that-no-verify-link-carries'
    await server.inTransaction(async ({ accountTokens }) => {
      await accountTokens.issue(
        {
          token: resetToken,
          playerId: player.id,
          kind: 'reset',
          expiresAt: accountTokenExpiryFrom('reset', clock.now()),
        },
        clock.now(),
      )
      return ok(undefined)
    })

    const response = await verifyEmail(resetToken)

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('TokenInvalid')
  })

  it('refuses a token no link carried', async () => {
    await signUpAna()

    const response = await verifyEmail('a-token-nobody-was-sent')

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('TokenInvalid')
  })

  it('refuses a verify request without a token as malformed', async () => {
    const response = await app.request('/auth/verify-email', post({}))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it('stops the earlier link working when a new one is sent', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    const earlierToken = tokenOf(mailer.sentTo(anasSignUp.email)[0])

    const resent = await resendFor(cookie)

    expect(resent.status).toBe(204)
    const laterToken = tokenOf(mailer.sentTo(anasSignUp.email)[1])
    expect((await verifyEmail(earlierToken)).status).toBe(400)
    expect((await verifyEmail(laterToken)).status).toBe(204)
  })

  it('sends no mail to a verified player', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))

    const resent = await resendFor(cookie)

    expect(resent.status).toBe(204)
    expect(mailer.sentTo(anasSignUp.email)).toHaveLength(1)
  })

  it('answers 503 when the new link cannot be sent', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const resent = await resendFor(cookie, failingApp)

    expect(resent.status).toBe(503)
    expect(ApiErrorSchema.parse(await resent.json()).kind).toBe('MailNotSent')
  })

  it('answers 401 for a resend without a session', async () => {
    const response = await app.request('/auth/verify-email/resend', post({}))

    expect(response.status).toBe(401)
  })

  const resetMailSubject = 'Cambia tu contraseña'

  const resetMailsTo = (email: string): ReadonlyArray<Mail> =>
    mailer.sentTo(email).filter((mail) => mail.subject === resetMailSubject)

  const verifiedAna = async (): Promise<string> => {
    const cookie = sessionCookieOf(await signUpAna())
    await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))
    return cookie
  }

  const forgotPassword = async (email: string, forgettingApp = app): Promise<Response> =>
    forgettingApp.request('/auth/forgot-password', post({ email }))

  const resetPassword = async (token: string, password: string): Promise<Response> =>
    app.request('/auth/reset-password', post({ token, password }))

  const signInAna = async (password: string): Promise<Response> =>
    app.request('/auth/sign-in', post({ email: anasSignUp.email, password }))

  const resetLinkOfAna = async (): Promise<string> => {
    await forgotPassword(anasSignUp.email)
    await server.afterResponse.settled()
    return tokenOf(resetMailsTo(anasSignUp.email).at(-1))
  }

  const newPassword = 'acero-y-trigo'

  it('sends a reset link to a verified email', async () => {
    await verifiedAna()

    const response = await forgotPassword(anasSignUp.email)
    await server.afterResponse.settled()

    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
    const sent = resetMailsTo(anasSignUp.email)
    expect(sent).toHaveLength(1)
    expect(tokenOf(sent[0])).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('sends nothing to an unverified email', async () => {
    await signUpAna()

    const response = await forgotPassword(anasSignUp.email)
    await server.afterResponse.settled()

    expect(response.status).toBe(202)
    expect(resetMailsTo(anasSignUp.email)).toEqual([])
    expect(await storedResetTokens()).toBe(0)
  })

  it('answers an unknown email as it answers a known one', async () => {
    await verifiedAna()

    const known = await forgotPassword(anasSignUp.email)
    const unknown = await forgotPassword('nadie@example.com')
    await server.afterResponse.settled()

    expect([unknown.status, await unknown.text()]).toEqual([known.status, await known.text()])
    expect(mailer.sentTo('nadie@example.com')).toEqual([])
  })

  it('answers a reset request before it looks the address up', async () => {
    let lookups = 0
    let release = (): void => {}
    const released = new Promise<void>((resolve) => {
      release = resolve
    })
    const heldTransaction: Transaction<ComposedStores> = (work) => {
      lookups += 1
      return released.then(() => server.inTransaction(work))
    }

    const response = await forgotPassword(
      anasSignUp.email,
      createApp({ ...server, clock, mailer, inTransaction: heldTransaction }),
    )

    expect([response.status, lookups]).toEqual([202, 1])
    release()
    await server.afterResponse.settled()
  })

  it('reports a reset request whose send threw by the error class alone', async () => {
    await verifiedAna()
    const failures: Array<string> = []
    const throwingApp = createApp({
      ...server,
      clock,
      mailer: { send: () => Promise.reject(new TypeError('ana@example.com refused')) },
      failureSink: { write: (line) => failures.push(line) },
    })

    await forgotPassword(anasSignUp.email, throwingApp)
    await server.afterResponse.settled()

    expect(failures).toEqual(['reset request TypeError'])
  })

  it('answers 202 when the reset link cannot be sent', async () => {
    await verifiedAna()
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const response = await forgotPassword(anasSignUp.email, failingApp)
    await server.afterResponse.settled()

    expect(response.status).toBe(202)
  })

  it('reports a reset request whose mail could not be sent without its address', async () => {
    await verifiedAna()
    const failures: Array<string> = []
    const failingApp = createApp({
      ...server,
      clock,
      mailer: MemoryMailer.failing(),
      failureSink: { write: (line) => failures.push(line) },
    })

    await forgotPassword(anasSignUp.email, failingApp)
    await server.afterResponse.settled()

    expect(failures).toEqual(['reset request MailNotSent'])
  })

  it('refuses a reset request with a malformed email', async () => {
    const response = await forgotPassword('ana')

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it('sets the new password', async () => {
    await verifiedAna()

    const reset = await resetPassword(await resetLinkOfAna(), newPassword)

    expect(reset.status).toBe(204)
    expect((await signInAna(newPassword)).status).toBe(200)
  })

  it('opens no session when it sets the new password', async () => {
    await verifiedAna()

    const reset = await resetPassword(await resetLinkOfAna(), newPassword)

    expect(reset.headers.get('set-cookie')).toBeNull()
    expect(await storedSessionKeys()).toEqual([])
  })

  it('refuses the old password after a reset', async () => {
    await verifiedAna()

    await resetPassword(await resetLinkOfAna(), newPassword)

    const signedIn = await signInAna(anasSignUp.password)
    expect(signedIn.status).toBe(401)
    expect(ApiErrorSchema.parse(await signedIn.json()).kind).toBe('InvalidCredentials')
  })

  it('signs out every session of the player', async () => {
    const signUpCookie = await verifiedAna()
    const signInCookie = sessionCookieOf(await signInAna(anasSignUp.password))

    await resetPassword(await resetLinkOfAna(), newPassword)

    expect((await sessionOf(signUpCookie)).status).toBe(401)
    expect((await sessionOf(signInCookie)).status).toBe(401)
  })

  it('keeps the sessions of every other player', async () => {
    await verifiedAna()
    const brunosCookie = sessionCookieOf(
      await app.request(
        '/auth/sign-up',
        post({ email: 'bruno@example.com', password: 'piedra-y-oro', scaffold: 'es' }),
      ),
    )

    await resetPassword(await resetLinkOfAna(), newPassword)

    expect((await sessionOf(brunosCookie)).status).toBe(200)
  })

  it('refuses a reset link used twice', async () => {
    await verifiedAna()
    const token = await resetLinkOfAna()
    await resetPassword(token, newPassword)

    const second = await resetPassword(token, 'otra-clave-nueva')

    expect(second.status).toBe(400)
    expect(ApiErrorSchema.parse(await second.json()).kind).toBe('TokenInvalid')
  })

  it('refuses a reset link past its hour', async () => {
    await verifiedAna()
    const token = await resetLinkOfAna()
    clock.advanceHours(1)

    const response = await resetPassword(token, newPassword)

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('TokenInvalid')
  })

  it('refuses a verify token as a reset link', async () => {
    await signUpAna()
    const verifyToken = tokenOf(mailer.sentTo(anasSignUp.email)[0])

    const response = await resetPassword(verifyToken, newPassword)

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('TokenInvalid')
  })

  it('refuses a short new password', async () => {
    await verifiedAna()
    const token = await resetLinkOfAna()

    const response = await resetPassword(token, 'corta77')

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('WeakPassword')
    expect((await resetPassword(token, newPassword)).status).toBe(204)
  })

  it('refuses a reset without a token as malformed', async () => {
    const response = await app.request('/auth/reset-password', post({ password: newPassword }))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it('stops the earlier reset link working when a new one is asked', async () => {
    await verifiedAna()
    const earlierToken = await resetLinkOfAna()

    const laterToken = await resetLinkOfAna()

    expect((await resetPassword(earlierToken, newPassword)).status).toBe(400)
    expect((await resetPassword(laterToken, newPassword)).status).toBe(204)
  })
})

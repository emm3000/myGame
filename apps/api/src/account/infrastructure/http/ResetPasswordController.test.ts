import { ApiErrorSchema } from '@mygame/contracts'
import { MemoryMailer } from '@mygame/domain/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import {
  accountRequests,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  passwordResets,
  post,
  sessionCookieOf,
  storedSessionKeys,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the reset-password route', () => {
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

  const { signUpAna, sessionOf } = accountRequests(() => app)

  const { verifiedAna, resetPassword, signInAna, resetLinkOfAna } = passwordResets(
    () => app,
    () => server,
    () => mailer,
  )

  const newPassword = 'acero-y-trigo'

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

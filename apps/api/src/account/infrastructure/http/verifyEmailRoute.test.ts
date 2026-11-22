import { ApiErrorSchema, PlayerSchema } from '@mygame/contracts'
import { ok } from '@mygame/domain'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { accountTokenExpiryFrom } from '../../application/accountTokenExpiryFrom'
import { MemoryMailer } from '../memory/MemoryMailer'
import {
  accountRequests,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  emailVerifiedAtOf,
  type MovableClock,
  movableClock,
  post,
  sessionCookieOf,
  signedUpAt,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the verify-email route', () => {
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

  const { signUpAna, isEmailVerified, verifyEmail } = accountRequests(() => app)

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
})

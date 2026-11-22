import { NativeSessionSchema, PlayerSchema } from '@mygame/contracts'
import { MemoryMailer } from '@mygame/domain/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import {
  accountRequests,
  anasSignIn,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  sessionCookieOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the session route', () => {
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

  const { signUpAna, sessionOf, signInNatively } = accountRequests(() => app)

  it('answers the signed-in player behind the session cookie', async () => {
    const cookie = sessionCookieOf(await signUpAna())

    const response = await sessionOf(cookie)

    expect(response.status).toBe(200)
    expect(PlayerSchema.parse(await response.json()).email).toBe(anasSignUp.email)
  })

  it('answers 401 without a session', async () => {
    const response = await app.request('/auth/session')

    expect(response.status).toBe(401)
  })

  it('stops authenticating a session thirty days after its last use', async () => {
    const cookie = sessionCookieOf(await signUpAna())

    clock.advanceDays(31)

    expect((await sessionOf(cookie)).status).toBe(401)
  })

  it('slides the session expiry on an authenticated request', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    clock.advanceDays(20)
    await sessionOf(cookie)

    clock.advanceDays(20)

    expect((await sessionOf(cookie)).status).toBe(200)
  })

  it('accepts the native sign-in token as a bearer on the session read', async () => {
    await signUpAna()
    const { token } = NativeSessionSchema.parse(await (await signInNatively(anasSignIn)).json())

    const response = await app.request('/auth/session', {
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.status).toBe(200)
    expect(PlayerSchema.parse(await response.json()).email).toBe(anasSignUp.email)
  })
})

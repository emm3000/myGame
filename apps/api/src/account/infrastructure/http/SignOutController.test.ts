import { NativeSessionSchema } from '@mygame/contracts'
import { MemoryMailer } from '@mygame/domain/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import {
  accountRequests,
  anasSignIn,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  post,
  sessionCookieOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the sign-out route', () => {
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

  it('stops authenticating a signed-out token', async () => {
    const cookie = sessionCookieOf(await signUpAna())

    const signedOut = await app.request('/auth/sign-out', post({}, cookie))

    expect(signedOut.status).toBe(204)
    expect((await sessionOf(cookie)).status).toBe(401)
  })

  it('clears the session cookie on sign-out', async () => {
    const cookie = sessionCookieOf(await signUpAna())

    const signedOut = await app.request('/auth/sign-out', post({}, cookie))

    expect(signedOut.headers.getSetCookie().at(-1)).toMatch(/^session=; Max-Age=0;/)
  })

  it('refuses the bearer token after its sign-out', async () => {
    await signUpAna()
    const { token } = NativeSessionSchema.parse(await (await signInNatively(anasSignIn)).json())
    const bearer = { authorization: `Bearer ${token}` }

    const signedOut = await app.request('/auth/sign-out', { method: 'POST', headers: bearer })

    expect(signedOut.status).toBe(204)
    expect((await app.request('/auth/session', { headers: bearer })).status).toBe(401)
  })
})

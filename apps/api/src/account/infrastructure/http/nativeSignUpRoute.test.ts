import { ApiErrorSchema, NativeSessionSchema, PlayerSchema } from '@mygame/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { MemoryMailer } from '../memory/MemoryMailer'
import {
  accountRequests,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  post,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the native sign-up route', () => {
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

  const { signUpAna } = accountRequests(() => app)

  const signUpNatively = async (body: object): Promise<Response> =>
    app.request('/auth/sign-up/native', post(body))

  it('answers the token and no cookie to a native sign-up', async () => {
    const response = await signUpNatively(anasSignUp)

    expect(response.status).toBe(201)
    expect(response.headers.get('set-cookie')).toBeNull()
    const { token, player } = NativeSessionSchema.parse(await response.json())
    expect(player.email).toBe(anasSignUp.email)
    const session = await app.request('/auth/session', {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(PlayerSchema.parse(await session.json()).email).toBe(anasSignUp.email)
  })

  it('refuses a native sign-up as the web sign-up does', async () => {
    await signUpAna()
    const refusedSignUps = [
      { ...anasSignUp, email: 'bea@example.com', password: 'corta77' },
      { ...anasSignUp, email: 'Ana@Example.com' },
      { ...anasSignUp, email: 'bea@example.com', password: 12345678 },
      { ...anasSignUp, email: 'bea-sin-arroba' },
    ]

    const webAnswers: Array<readonly [number, string]> = []
    const nativeAnswers: Array<readonly [number, string]> = []
    for (const body of refusedSignUps) {
      const web = await app.request('/auth/sign-up', post(body))
      webAnswers.push([web.status, await web.text()])
      const native = await signUpNatively(body)
      nativeAnswers.push([native.status, await native.text()])
    }

    expect(webAnswers.map(([status]) => status)).toEqual([400, 409, 400, 400])
    expect(
      [webAnswers[0], webAnswers[1], webAnswers[3]].map(
        (answer) => ApiErrorSchema.parse(JSON.parse(answer?.[1] ?? '')).kind,
      ),
    ).toEqual(['WeakPassword', 'EmailTaken', 'MalformedEmail'])
    expect(nativeAnswers).toEqual(webAnswers)
  })

  it('sends the verification mail to a native sign-up', async () => {
    await signUpNatively(anasSignUp)

    expect(tokenOf(mailer.sentTo(anasSignUp.email)[0])).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })
})

import { ApiErrorSchema, PlayerSchema } from '@mygame/contracts'
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
  post,
  sessionCookieOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the sign-in route', () => {
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

  it('answers the same refusal for an unknown email and a wrong password', async () => {
    await signUpAna()

    const wrongPassword = await app.request(
      '/auth/sign-in',
      post({ email: anasSignUp.email, password: 'lana-y-hierro' }),
    )
    const unknownEmail = await app.request(
      '/auth/sign-in',
      post({ email: 'nadie@example.com', password: anasSignUp.password }),
    )

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(wrongPassword.status)
    const refusal = ApiErrorSchema.parse(await wrongPassword.json())
    expect(refusal.kind).toBe('InvalidCredentials')
    expect(ApiErrorSchema.parse(await unknownEmail.json())).toEqual(refusal)
  })

  it('signs in with the email in any letter case and the right password', async () => {
    await signUpAna()

    const response = await app.request(
      '/auth/sign-in',
      post({ email: 'ANA@example.com', password: anasSignUp.password }),
    )

    expect(response.status).toBe(200)
    expect(PlayerSchema.parse(await response.json()).email).toBe(anasSignUp.email)
  })

  it('answers no token in the body of the web sign-in', async () => {
    await signUpAna()

    const response = await app.request('/auth/sign-in', post(anasSignIn))

    const [, token = ''] = sessionCookieOf(response).split('=')
    expect(token).not.toBe('')
    expect(await response.text()).not.toContain(token)
  })
})

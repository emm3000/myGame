import { ApiErrorSchema, NativeSessionSchema } from '@mygame/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { MemoryMailer } from '../memory/MemoryMailer'
import {
  accountRequests,
  anasSignIn,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the native sign-in route', () => {
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

  const { signUpAna, signInNatively } = accountRequests(() => app)

  it('answers the session token in the body of the native sign-in', async () => {
    await signUpAna()

    const response = await signInNatively(anasSignIn)

    expect(response.status).toBe(200)
    expect(NativeSessionSchema.parse(await response.json()).player.email).toBe(anasSignUp.email)
  })

  it('sets no cookie on the native sign-in', async () => {
    await signUpAna()

    const response = await signInNatively(anasSignIn)

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('refuses the native sign-in with a wrong password as invalid credentials', async () => {
    await signUpAna()

    const response = await signInNatively({ ...anasSignIn, password: 'lana-y-hierro' })

    expect(response.status).toBe(401)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InvalidCredentials')
  })

  it('refuses a malformed native sign-in as invalid credentials', async () => {
    const response = await signInNatively({ email: 'no-es-un-correo' })

    expect(response.status).toBe(401)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InvalidCredentials')
  })
})

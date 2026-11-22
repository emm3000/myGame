import { ApiErrorSchema, PlayerSchema } from '@mygame/contracts'
import { MemoryMailer } from '@mygame/domain/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { tokenDigest } from '../persistence/tokenDigest'
import {
  accountRequests,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  playersWithEmail,
  post,
  sessionCookieOf,
  storedSessionKeys,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the sign-up route', () => {
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

  const { signUpAna, isEmailVerified } = accountRequests(() => app)

  it('refuses a password shorter than eight characters', async () => {
    const response = await app.request(
      '/auth/sign-up',
      post({ ...anasSignUp, password: 'corta77' }),
    )

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('WeakPassword')
  })

  it('refuses a password that is not text as a malformed request', async () => {
    const response = await app.request('/auth/sign-up', post({ ...anasSignUp, password: 12345678 }))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it.each(['/auth/sign-up', '/auth/sign-up/native'])(
    'stores on %s the scaffold language the player picks at sign-up',
    async (route) => {
      await app.request(route, post({ ...anasSignUp, scaffold: 'none' }))
      const signedIn = await app.request('/auth/sign-in', post(anasSignUp))

      expect(PlayerSchema.parse(await signedIn.json()).scaffold).toBe('none')
    },
  )

  it('refuses a sign-up without a scaffold language as a malformed request', async () => {
    const { scaffold: _, ...withoutScaffold } = anasSignUp
    const response = await app.request('/auth/sign-up', post(withoutScaffold))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it('refuses a malformed email with a message the sign-up screen can show', async () => {
    const response = await app.request(
      '/auth/sign-up',
      post({ ...anasSignUp, email: 'ana-sin-arroba' }),
    )

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('MalformedEmail')
  })

  it('names the malformed email before the short password', async () => {
    const response = await app.request(
      '/auth/sign-up',
      post({ ...anasSignUp, email: 'ana-sin-arroba', password: 'corta77' }),
    )

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('MalformedEmail')
  })

  it('refuses an email that is not text as a malformed request', async () => {
    const response = await app.request('/auth/sign-up', post({ ...anasSignUp, email: 42 }))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it('refuses a second account on the same email', async () => {
    await signUpAna()

    const response = await app.request(
      '/auth/sign-up',
      post({ ...anasSignUp, email: 'Ana@Example.com' }),
    )

    expect(response.status).toBe(409)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('EmailTaken')
  })

  it('sets the session in a secure http-only cookie that lasts thirty days', async () => {
    const response = await signUpAna()

    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/^session=[A-Za-z0-9_-]{43};/)
    expect(setCookie).toContain('Max-Age=2592000')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Lax')
  })

  it('sets the session cookie without Secure when the server is composed for plain http', async () => {
    const plainHttpApp = createApp({ ...server, clock, isSessionCookieSecure: false })

    const response = await plainHttpApp.request('/auth/sign-up', post(anasSignUp))

    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).not.toContain('Secure')
  })

  it('stores the digest of the session token, never the token', async () => {
    const [, token = ''] = sessionCookieOf(await signUpAna()).split('=')

    expect(await storedSessionKeys()).toEqual([tokenDigest(token)])
  })

  it('answers no token in the body of the web sign-up', async () => {
    const response = await signUpAna()

    const [, token = ''] = sessionCookieOf(response).split('=')
    expect(token).not.toBe('')
    expect(await response.text()).not.toContain(token)
  })

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
})

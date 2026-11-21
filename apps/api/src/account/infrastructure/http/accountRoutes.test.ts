import { ApiErrorSchema, NativeSessionSchema, PlayerSchema } from '@mygame/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { tokenDigest } from '../../application/tokenDigest'
import { MemoryMailer } from '../memory/MemoryMailer'
import {
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  playersWithEmail,
  post,
  sessionCookieOf,
  storedSessionKeys,
  storedTowns,
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

  const signUpAna = async (): Promise<Response> => app.request('/auth/sign-up', post(anasSignUp))

  const sessionOf = async (cookie: string): Promise<Response> =>
    app.request('/auth/session', { headers: { cookie } })

  it('signs up without founding anything', async () => {
    const response = await signUpAna()

    expect(response.status).toBe(201)
    PlayerSchema.parse(await response.json())
    expect(await storedTowns()).toBe(0)
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

  it.each(['/auth/sign-up', '/auth/sign-up/native'])(
    'signs up on %s an older client that sends a field the request no longer names',
    async (route) => {
      const response = await app.request(
        route,
        post({ ...anasSignUp, retiredField: 'Maple Grove' }),
      )

      expect(response.status).toBe(201)
      expect(await playersWithEmail(anasSignUp.email)).toBe(1)
      expect(await storedTowns()).toBe(0)
    },
  )

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

  const anasSignIn = { email: anasSignUp.email, password: anasSignUp.password }

  const signInNatively = async (body: object): Promise<Response> =>
    app.request('/auth/sign-in/native', post(body))

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

  it('accepts the native sign-in token as a bearer on the session read', async () => {
    await signUpAna()
    const { token } = NativeSessionSchema.parse(await (await signInNatively(anasSignIn)).json())

    const response = await app.request('/auth/session', {
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.status).toBe(200)
    expect(PlayerSchema.parse(await response.json()).email).toBe(anasSignUp.email)
  })

  it('refuses the bearer token after its sign-out', async () => {
    await signUpAna()
    const { token } = NativeSessionSchema.parse(await (await signInNatively(anasSignIn)).json())
    const bearer = { authorization: `Bearer ${token}` }

    const signedOut = await app.request('/auth/sign-out', { method: 'POST', headers: bearer })

    expect(signedOut.status).toBe(204)
    expect((await app.request('/auth/session', { headers: bearer })).status).toBe(401)
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

  it('answers no token in the body of the web sign-in', async () => {
    await signUpAna()

    const response = await app.request('/auth/sign-in', post(anasSignIn))

    const [, token = ''] = sessionCookieOf(response).split('=')
    expect(token).not.toBe('')
    expect(await response.text()).not.toContain(token)
  })

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

  it('answers no token in the body of the web sign-up', async () => {
    const response = await signUpAna()

    const [, token = ''] = sessionCookieOf(response).split('=')
    expect(token).not.toBe('')
    expect(await response.text()).not.toContain(token)
  })
})

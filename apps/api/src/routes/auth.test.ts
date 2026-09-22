import { fileURLToPath } from 'node:url'
import { ApiErrorSchema, PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const millisecondsPerDay = 86_400_000

const signedUpAt = Date.parse('2026-09-22T08:00:00Z')

type MovableClock = Clock & { readonly advanceDays: (days: number) => void }

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  return {
    now: () => current,
    advanceDays: (days) => {
      current = Instant.fromEpochMilliseconds(current.epochMilliseconds + days * millisecondsPerDay)
    },
  }
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const truncateAccounts = async (): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query('TRUNCATE players, sessions, fiefs, fief_buildings')
  } finally {
    await client.end()
  }
}

const playersWithEmail = async (email: string): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query('SELECT id FROM players WHERE lower(email) = lower($1)', [
      email,
    ])
    return found.rowCount ?? 0
  } finally {
    await client.end()
  }
}

const post = (body: object, cookie?: string): RequestInit => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(cookie === undefined ? {} : { cookie }),
  },
  body: JSON.stringify(body),
})

const sessionCookieOf = (response: Response): string => {
  const setCookie = response.headers.get('set-cookie') ?? ''
  const [pair = ''] = setCookie.split(';')
  return pair
}

const anasSignUp = { email: 'ana@example.com', password: 'hierro-y-lana', fiefName: 'Valdehierro' }

describe('the auth routes', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ API_PORT: '3192', DATABASE_URL: databaseUrl() }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await truncateAccounts()
    clock = movableClock()
    app = createApp({ ...server, clock })
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

  it('creates a player and its fief in one transaction', async () => {
    const response = await signUpAna()

    expect(response.status).toBe(201)
    const player = PlayerSchema.parse(await response.json())
    const fief = await server.fiefs.fiefOf(player.id)
    expect(fief.ok && fief.value?.name.value).toBe('Valdehierro')
  })

  it('keeps no player when founding the fief fails', async () => {
    const response = await app.request('/auth/sign-up', post({ ...anasSignUp, fiefName: '   ' }))

    expect(response.status).toBe(400)
    expect(await playersWithEmail(anasSignUp.email)).toBe(0)
  })

  it('refuses a blank fief name with a message the sign-up screen can show', async () => {
    const response = await app.request('/auth/sign-up', post({ ...anasSignUp, fiefName: ' \t ' }))

    expect(response.status).toBe(400)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('BlankFiefName')
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
      post({ ...anasSignUp, email: 'Ana@Example.com', fiefName: 'Otra' }),
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
})

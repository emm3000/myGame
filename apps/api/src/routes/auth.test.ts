import { fileURLToPath } from 'node:url'
import { ApiErrorSchema, FiefListSchema, PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant, ok } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MemoryMailer } from '../adapters/memory/MemoryMailer'
import { createApp } from '../app'
import { accountTokenExpiryFrom } from '../auth/accountTokenExpiryFrom'
import type { Mail } from '../auth/Mailer'
import { tokenDigest } from '../auth/tokenDigest'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const millisecondsPerHour = 3_600_000

const millisecondsPerDay = 24 * millisecondsPerHour

const signedUpAt = Date.parse('2026-09-22T08:00:00Z')

type MovableClock = Clock & {
  readonly advanceDays: (days: number) => void
  readonly advanceHours: (hours: number) => void
}

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  const advance = (milliseconds: number): void => {
    current = Instant.fromEpochMilliseconds(current.epochMilliseconds + milliseconds)
  }
  return {
    now: () => current,
    advanceDays: (days) => advance(days * millisecondsPerDay),
    advanceHours: (hours) => advance(hours * millisecondsPerHour),
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
    await client.query(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
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

const storedSessionKeys = async (): Promise<ReadonlyArray<string>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query<{ key: string }>('SELECT token_digest AS key FROM sessions')
    return found.rows.map((row) => row.key)
  } finally {
    await client.end()
  }
}

const storedResetTokens = async (): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query("SELECT token_digest FROM account_tokens WHERE kind = 'reset'")
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

const tokenOf = (mail: Mail | undefined): string => {
  const link = mail?.text.split('\n').find((line) => line.startsWith(mailEnvironment.WEB_URL))
  return link === undefined ? '' : (new URL(link).searchParams.get('token') ?? '')
}

describe('the auth routes', () => {
  let server: ComposedServer
  let clock: MovableClock
  let mailer: MemoryMailer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3192', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
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

  it('creates a player and its fief in one transaction', async () => {
    const response = await signUpAna()

    expect(response.status).toBe(201)
    PlayerSchema.parse(await response.json())
    const fiefs = await app.request('/fiefs', { headers: { cookie: sessionCookieOf(response) } })
    expect(FiefListSchema.parse(await fiefs.json()).fiefs.map(({ name }) => name)).toEqual([
      'Valdehierro',
    ])
  })

  it('acknowledges a new player at sign-up', async () => {
    clock.advanceHours(3)

    const response = await signUpAna()

    const player = PlayerSchema.parse(await response.json())
    expect(await server.digestAcknowledgements.acknowledgedAt(player.id)).toEqual(clock.now())
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

  const verifyEmail = async (token: string): Promise<Response> =>
    app.request('/auth/verify-email', post({ token }))

  const resendFor = async (cookie: string, resendingApp = app): Promise<Response> =>
    resendingApp.request('/auth/verify-email/resend', post({}, cookie))

  const isEmailVerified = async (cookie: string): Promise<boolean> =>
    PlayerSchema.parse(await (await sessionOf(cookie)).json()).emailVerified

  it('sends the verification mail to a new player', async () => {
    await signUpAna()

    const sent = mailer.sentTo(anasSignUp.email)
    const token = tokenOf(sent[0])
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(sent).toEqual([
      {
        to: anasSignUp.email,
        subject: 'Confirma tu correo',
        text: [
          'Confirma que este correo es el de tu feudo abriendo este enlace:',
          '',
          `http://localhost:3259/verify-email?token=${token}`,
          '',
          'El enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu feudo.',
          '',
          'Si no has fundado ningún feudo, ignora este correo.',
        ].join('\n'),
      },
    ])
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

  it('refuses a verify link used twice', async () => {
    await signUpAna()
    const token = tokenOf(mailer.sentTo(anasSignUp.email)[0])
    await verifyEmail(token)

    const second = await verifyEmail(token)

    expect(second.status).toBe(400)
    expect(ApiErrorSchema.parse(await second.json()).kind).toBe('TokenInvalid')
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

  it('stops the earlier link working when a new one is sent', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    const earlierToken = tokenOf(mailer.sentTo(anasSignUp.email)[0])

    const resent = await resendFor(cookie)

    expect(resent.status).toBe(204)
    const laterToken = tokenOf(mailer.sentTo(anasSignUp.email)[1])
    expect((await verifyEmail(earlierToken)).status).toBe(400)
    expect((await verifyEmail(laterToken)).status).toBe(204)
  })

  it('sends no mail to a verified player', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))

    const resent = await resendFor(cookie)

    expect(resent.status).toBe(204)
    expect(mailer.sentTo(anasSignUp.email)).toHaveLength(1)
  })

  it('answers 503 when the new link cannot be sent', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const resent = await resendFor(cookie, failingApp)

    expect(resent.status).toBe(503)
    expect(ApiErrorSchema.parse(await resent.json()).kind).toBe('MailNotSent')
  })

  it('answers 401 for a resend without a session', async () => {
    const response = await app.request('/auth/verify-email/resend', post({}))

    expect(response.status).toBe(401)
  })

  const resetMailSubject = 'Cambia tu contraseña'

  const resetMailsTo = (email: string): ReadonlyArray<Mail> =>
    mailer.sentTo(email).filter((mail) => mail.subject === resetMailSubject)

  const verifiedAna = async (): Promise<string> => {
    const cookie = sessionCookieOf(await signUpAna())
    await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))
    return cookie
  }

  const forgotPassword = async (email: string, forgettingApp = app): Promise<Response> =>
    forgettingApp.request('/auth/forgot-password', post({ email }))

  const resetPassword = async (token: string, password: string): Promise<Response> =>
    app.request('/auth/reset-password', post({ token, password }))

  const signInAna = async (password: string): Promise<Response> =>
    app.request('/auth/sign-in', post({ email: anasSignUp.email, password }))

  const resetLinkOfAna = async (): Promise<string> => {
    await forgotPassword(anasSignUp.email)
    return tokenOf(resetMailsTo(anasSignUp.email).at(-1))
  }

  const newPassword = 'acero-y-trigo'

  it('sends a reset link to a verified email', async () => {
    await verifiedAna()

    const response = await forgotPassword(anasSignUp.email)

    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
    const sent = resetMailsTo(anasSignUp.email)
    const token = tokenOf(sent[0])
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(sent).toEqual([
      {
        to: anasSignUp.email,
        subject: resetMailSubject,
        text: [
          'Alguien ha pedido cambiar la contraseña de tu feudo. Si fuiste tú, abre este enlace y elige una nueva:',
          '',
          `http://localhost:3259/reset-password?token=${token}`,
          '',
          'El enlace vale una hora y una sola vez.',
          '',
          'Si no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.',
        ].join('\n'),
      },
    ])
  })

  it('sends nothing to an unverified email', async () => {
    await signUpAna()

    const response = await forgotPassword(anasSignUp.email)

    expect(response.status).toBe(202)
    expect(resetMailsTo(anasSignUp.email)).toEqual([])
    expect(await storedResetTokens()).toBe(0)
  })

  it('answers an unknown email as it answers a known one', async () => {
    await verifiedAna()

    const known = await forgotPassword(anasSignUp.email)
    const unknown = await forgotPassword('nadie@example.com')

    expect([unknown.status, await unknown.text()]).toEqual([known.status, await known.text()])
    expect(mailer.sentTo('nadie@example.com')).toEqual([])
  })

  it('answers 202 when the reset link cannot be sent', async () => {
    await verifiedAna()
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const response = await forgotPassword(anasSignUp.email, failingApp)

    expect(response.status).toBe(202)
  })

  it('refuses a reset request with a malformed email', async () => {
    const response = await forgotPassword('ana')

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

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
        post({ email: 'bruno@example.com', password: 'piedra-y-oro', fiefName: 'Pedregal' }),
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

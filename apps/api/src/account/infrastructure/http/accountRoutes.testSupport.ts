import { PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import type { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import type { Mail } from '../../application/ports/Mailer'
import type { MemoryMailer } from '../memory/MemoryMailer'

export const contentDirectory = apiPackagePath('content/')

export const millisecondsPerHour = 3_600_000

export const millisecondsPerDay = 24 * millisecondsPerHour

export const signedUpAt = Date.parse('2026-09-22T08:00:00Z')

export type MovableClock = Clock & {
  readonly advanceDays: (days: number) => void
  readonly advanceHours: (hours: number) => void
}

export const movableClock = (): MovableClock => {
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

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

export const rowsOf = async (
  statement: string,
  parameters: ReadonlyArray<unknown> = [],
): Promise<ReadonlyArray<unknown>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    return (await client.query(statement, [...parameters])).rows
  } finally {
    await client.end()
  }
}

export const truncateAccounts = async (): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(truncatePlayerTables)
  } finally {
    await client.end()
  }
}

export const playersWithEmail = async (email: string): Promise<number> => {
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

export const storedSessionKeys = async (): Promise<ReadonlyArray<string>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query<{ key: string }>('SELECT token_digest AS key FROM sessions')
    return found.rows.map((row) => row.key)
  } finally {
    await client.end()
  }
}

export const emailVerifiedAtOf = async (email: string): Promise<number | undefined> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query<{ verifiedAt: Date | null }>(
      'SELECT email_verified_at AS "verifiedAt" FROM players WHERE lower(email) = lower($1)',
      [email],
    )
    return found.rows[0]?.verifiedAt?.getTime()
  } finally {
    await client.end()
  }
}

export const storedResetTokens = async (): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query("SELECT token_digest FROM account_tokens WHERE kind = 'reset'")
    return found.rowCount ?? 0
  } finally {
    await client.end()
  }
}

export const post = (body: object, cookie?: string): RequestInit => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(cookie === undefined ? {} : { cookie }),
  },
  body: JSON.stringify(body),
})

export const sessionCookieOf = (response: Response): string => {
  const setCookie = response.headers.get('set-cookie') ?? ''
  const [pair = ''] = setCookie.split(';')
  return pair
}

export const anasSignUp = { email: 'ana@example.com', password: 'hierro-y-lana', scaffold: 'es' }

export const tokenOf = (mail: Mail | undefined): string => {
  const link = mail?.text.split('\n').find((line) => line.startsWith(mailEnvironment.WEB_URL))
  return link === undefined ? '' : (new URL(link).searchParams.get('token') ?? '')
}

export type AccountApp = ReturnType<typeof createApp>

export type AccountRequests = {
  readonly signUpAna: () => Promise<Response>
  readonly sessionOf: (cookie: string) => Promise<Response>
  readonly isEmailVerified: (cookie: string) => Promise<boolean>
  readonly verifyEmail: (token: string) => Promise<Response>
  readonly signInNatively: (body: object) => Promise<Response>
}

export const accountRequests = (appOf: () => AccountApp): AccountRequests => {
  const signUpAna = async (): Promise<Response> =>
    appOf().request('/auth/sign-up', post(anasSignUp))

  const sessionOf = async (cookie: string): Promise<Response> =>
    appOf().request('/auth/session', { headers: { cookie } })

  const isEmailVerified = async (cookie: string): Promise<boolean> =>
    PlayerSchema.parse(await (await sessionOf(cookie)).json()).emailVerified

  const verifyEmail = async (token: string): Promise<Response> =>
    appOf().request('/auth/verify-email', post({ token }))

  const signInNatively = async (body: object): Promise<Response> =>
    appOf().request('/auth/sign-in/native', post(body))

  return { signUpAna, sessionOf, isEmailVerified, verifyEmail, signInNatively }
}

export const anasSignIn = { email: anasSignUp.email, password: anasSignUp.password }

const resetMailSubject = 'Cambia tu contraseña'

export type PasswordResets = {
  readonly resetMailsTo: (email: string) => ReadonlyArray<Mail>
  readonly verifiedAna: () => Promise<string>
  readonly forgotPassword: (email: string, forgettingApp?: AccountApp) => Promise<Response>
  readonly resetPassword: (token: string, password: string) => Promise<Response>
  readonly signInAna: (password: string) => Promise<Response>
  readonly resetLinkOfAna: () => Promise<string>
}

export const passwordResets = (
  appOf: () => AccountApp,
  serverOf: () => ComposedServer,
  mailerOf: () => MemoryMailer,
): PasswordResets => {
  const { signUpAna, verifyEmail } = accountRequests(appOf)

  const resetMailsTo = (email: string): ReadonlyArray<Mail> =>
    mailerOf()
      .sentTo(email)
      .filter((mail) => mail.subject === resetMailSubject)

  const verifiedAna = async (): Promise<string> => {
    const cookie = sessionCookieOf(await signUpAna())
    await verifyEmail(tokenOf(mailerOf().sentTo(anasSignUp.email)[0]))
    return cookie
  }

  const forgotPassword = async (
    email: string,
    forgettingApp: AccountApp = appOf(),
  ): Promise<Response> => forgettingApp.request('/auth/forgot-password', post({ email }))

  const resetPassword = async (token: string, password: string): Promise<Response> =>
    appOf().request('/auth/reset-password', post({ token, password }))

  const signInAna = async (password: string): Promise<Response> =>
    appOf().request('/auth/sign-in', post({ email: anasSignUp.email, password }))

  const resetLinkOfAna = async (): Promise<string> => {
    await forgotPassword(anasSignUp.email)
    await serverOf().afterResponse.settled()
    return tokenOf(resetMailsTo(anasSignUp.email).at(-1))
  }

  return { resetMailsTo, verifiedAna, forgotPassword, resetPassword, signInAna, resetLinkOfAna }
}

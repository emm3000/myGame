import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import { mailEnvironment } from '#composeServer.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import type { Mail } from '../../application/ports/Mailer'

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

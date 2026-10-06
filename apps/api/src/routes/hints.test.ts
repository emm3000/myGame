import { fileURLToPath } from 'node:url'
import { PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const frozenClock: Clock = {
  now: () => Instant.fromEpochMilliseconds(Date.parse('2026-10-06T08:00:00Z')),
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

describe('the hints route', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3198', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    app = createApp({ ...server, clock: frozenClock })
  })

  const signUpAna = async (): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
        fiefName: 'Valdehierro',
      }),
    })
    return sessionCookieOf(response)
  }

  const markSeen = async (cookie: string, hint: string): Promise<Response> =>
    app.request(`/hints/${hint}`, { method: 'POST', headers: { cookie } })

  const seenHintsOf = async (cookie: string): Promise<ReadonlyArray<string>> => {
    const session = await app.request('/auth/session', { headers: { cookie } })
    return PlayerSchema.parse(await session.json()).seenHints
  }

  it('answers no seen hint in the session of a new player', async () => {
    const cookie = await signUpAna()

    expect(await seenHintsOf(cookie)).toEqual([])
  })

  it('answers a dismissed hint in the session', async () => {
    const cookie = await signUpAna()

    const response = await markSeen(cookie, 'peasants')

    expect(response.status).toBe(204)
    expect(await seenHintsOf(cookie)).toEqual(['peasants'])
  })

  it('stores a hint once however often it is dismissed', async () => {
    const cookie = await signUpAna()
    await markSeen(cookie, 'marches')

    const response = await markSeen(cookie, 'marches')

    expect(response.status).toBe(204)
    expect(await seenHintsOf(cookie)).toEqual(['marches'])
  })

  it('refuses an unknown hint', async () => {
    const cookie = await signUpAna()

    const response = await markSeen(cookie, 'dragons')

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
    expect(await seenHintsOf(cookie)).toEqual([])
  })

  it('refuses a hint without a session', async () => {
    const response = await app.request('/hints/peasants', { method: 'POST' })

    expect(response.status).toBe(401)
  })
})

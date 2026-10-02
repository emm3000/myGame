import { fileURLToPath } from 'node:url'
import { FiefListSchema, PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const frozenClock: Clock = {
  now: () => Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
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

describe('the fief list route', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3196', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, camp_battles',
    )
    app = createApp({ ...server, clock: frozenClock })
  })

  const signUp = async (email: string, fiefName: string): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana', fiefName }),
    })
    expect(response.status).toBe(201)
    PlayerSchema.parse(await response.json())
    return sessionCookieOf(response)
  }

  it('lists the fiefs of the signed-in player', async () => {
    await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await app.request('/fiefs', { headers: { cookie: bruno } })

    expect(response.status).toBe(200)
    const { fiefs } = FiefListSchema.parse(await response.json())
    expect(fiefs.map(({ name, coordinates }) => ({ name, coordinates }))).toEqual([
      { name: 'Robledal', coordinates: { kingdom: 1, province: 1, plot: 2 } },
    ])
  })

  it('names each listed fief by the id its overview answers', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const list = await app.request('/fiefs', { headers: { cookie: ana } })
    const [listed] = FiefListSchema.parse(await list.json()).fiefs

    const overview = await app.request(`/fiefs/${listed?.id}`, { headers: { cookie: ana } })

    expect(overview.status).toBe(200)
  })

  it('answers 401 without a session', async () => {
    const response = await app.request('/fiefs')

    expect(response.status).toBe(401)
  })
})

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
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
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

  it('lists each fief with its free slots and full stores', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
      SELECT id, unnest(ARRAY['library', 'barracks']::building[]), 1 FROM fiefs`)
    await runSql(
      `UPDATE fiefs SET stone = 1000, food = 1200, slot_building = 'sawmill', slot_level = 1,
         slot_started_at = '2026-09-22T08:00:00Z', slot_finishes_at = '2026-09-22T08:02:00Z',
         slot_cost_wood = 60, slot_cost_stone = 15`,
    )

    const response = await app.request('/fiefs', { headers: { cookie: ana } })

    const [listed] = FiefListSchema.parse(await response.json()).fiefs
    expect({ freeSlots: listed?.freeSlots, fullStores: listed?.fullStores }).toEqual({
      freeSlots: ['study', 'recruit', 'march'],
      fullStores: ['stone', 'food'],
    })
  })

  it('leaves the study slot out below library level 1', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
      SELECT id, 'barracks'::building, 1 FROM fiefs`)

    const response = await app.request('/fiefs', { headers: { cookie: ana } })

    const [listed] = FiefListSchema.parse(await response.json()).fiefs
    expect(listed?.freeSlots).toEqual(['build', 'recruit', 'march'])
  })

  it('leaves the recruit and march slots out below barracks level 1', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await app.request('/fiefs', { headers: { cookie: ana } })

    const [listed] = FiefListSchema.parse(await response.json()).fiefs
    expect(listed?.freeSlots).toEqual(['build'])
  })

  const buildLibraryAndBarracks = async (): Promise<void> =>
    runSql(`INSERT INTO fief_buildings (fief_id, building, level)
      SELECT id, unnest(ARRAY['library', 'barracks']::building[]), 1 FROM fiefs`)

  const freeSlotsOf = async (cookie: string): Promise<ReadonlyArray<string> | undefined> => {
    const response = await app.request('/fiefs', { headers: { cookie } })
    const [listed] = FiefListSchema.parse(await response.json()).fiefs
    return listed?.freeSlots
  }

  it('leaves out the study slot while a study runs', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await buildLibraryAndBarracks()
    await runSql(
      `UPDATE fiefs SET study_art = 'smithing', study_level = 1,
         study_started_at = '2026-09-22T08:00:00Z', study_finishes_at = '2026-09-22T08:30:00Z',
         study_cost_wood = 120, study_cost_stone = 80, study_cost_iron = 150, study_cost_gold = 60`,
    )

    expect(await freeSlotsOf(ana)).toEqual(['build', 'recruit', 'march'])
  })

  it('leaves out the recruit slot while an order is open', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await buildLibraryAndBarracks()
    await runSql(
      `INSERT INTO fief_recruit_orders (fief_id, kind, count, cost_wood, cost_stone, cost_iron,
         cost_gold, cost_food, per_unit_seconds, started_at)
       SELECT id, 'infantry', 3, 60, 0, 30, 0, 90, 60, '2026-09-22T08:00:00Z' FROM fiefs`,
    )

    expect(await freeSlotsOf(ana)).toEqual(['build', 'study', 'march'])
  })

  it('leaves out the march slot while a march is away', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await buildLibraryAndBarracks()
    await runSql(`INSERT INTO fief_units (fief_id, kind, count)
      SELECT id, 'infantry'::unit, 10 FROM fiefs`)
    await runSql(
      `INSERT INTO fief_marches (fief_id, province, plot, infantry_count, cavalry_count, archer_count,
         settler_count, stay_hours, one_way_seconds, departed_at, loot_wood, loot_stone, loot_iron, loot_gold, loot_food,
         loot_percent_wood, loot_percent_stone, loot_percent_iron, loot_percent_gold, loot_percent_food)
       SELECT id, 2, 7, 10, 0, 0, 0, 1, 60, '2026-09-22T08:00:00Z', 30, 30, 0, 0, 0, 100, 100, 100, 100, 100
       FROM fiefs`,
    )

    expect(await freeSlotsOf(ana)).toEqual(['build', 'study', 'recruit'])
  })

  it('answers 401 without a session', async () => {
    const response = await app.request('/fiefs')

    expect(response.status).toBe(401)
  })
})

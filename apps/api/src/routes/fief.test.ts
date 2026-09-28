import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  FiefChronicleSchema,
  FiefOverviewSchema,
  PlayerSchema,
} from '@mygame/contracts'
import { type Clock, enqueueBuilding, Instant, type PlayerId } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const millisecondsPerMinute = 60_000

const signedUpAt = Date.parse('2026-09-22T08:00:00Z')

type MovableClock = Clock & { readonly advanceMinutes: (minutes: number) => void }

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  return {
    now: () => current,
    advanceMinutes: (minutes) => {
      current = Instant.fromEpochMilliseconds(
        current.epochMilliseconds + minutes * millisecondsPerMinute,
      )
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

const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

type StoredEventRow = {
  readonly kind: string
  readonly building: string | null
  readonly art: string | null
  readonly level: number
  readonly refund: ReadonlyArray<number>
  readonly occurredAt: string
}

const storedEvents = async (): Promise<ReadonlyArray<StoredEventRow>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const read = await client.query<StoredEventRow>(
      `SELECT kind, building, art, level,
         ARRAY[refund_wood, refund_stone, refund_iron, refund_gold, refund_food] AS refund,
         to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "occurredAt"
       FROM fief_events ORDER BY id`,
    )
    return read.rows
  } finally {
    await client.end()
  }
}

const statementTextOf = (query: unknown): string => {
  if (typeof query === 'string') {
    return query
  }
  if (typeof query === 'object' && query !== null && 'text' in query) {
    return String(query.text)
  }
  return ''
}

type SignedUpPlayer = {
  readonly cookie: string
  readonly playerId: PlayerId
}

const signUpRequest = (email: string, fiefName: string): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password: 'hierro-y-lana', fiefName }),
})

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

describe('the fief route', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3194', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events',
    )
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const signUp = async (email: string, fiefName: string): Promise<SignedUpPlayer> => {
    const response = await app.request('/auth/sign-up', signUpRequest(email, fiefName))
    const player = PlayerSchema.parse(await response.json())
    return { cookie: sessionCookieOf(response), playerId: player.id }
  }

  const enqueueSawmill = async (playerId: PlayerId): Promise<void> => {
    const enqueued = await server.inTransaction(({ fiefs }) =>
      enqueueBuilding(
        { playerId, building: 'sawmill' },
        { fiefs, catalog: server.buildingCatalog, clock },
      ),
    )
    expect(enqueued.ok).toBe(true)
  }

  const fiefOf = async (cookie: string): Promise<Response> =>
    app.request('/fief', { headers: { cookie } })

  const enqueue = async (cookie: string, building: string): Promise<Response> =>
    app.request('/fief/upgrades', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ building }),
    })

  it('answers the fief of the signed-in player', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana.cookie)

    expect(response.status).toBe(200)
    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.name).toBe('Valdehierro')
    expect(overview.resources.wood).toEqual({ amount: 500, ratePerHour: 10, capacity: 1000 })
    expect(overview.peasants).toEqual({
      supplied: 10,
      occupied: 0,
      free: 10,
      projectedSupplied: 10,
      projectedOccupied: 0,
      projectedFree: 10,
    })
    expect(overview.slot).toEqual({ kind: 'idle' })
    expect(overview.queue).toEqual({ entries: [], cap: 4 })
    expect(overview.readAt).toBe('2026-09-22T08:00:00.000Z')
  })

  it('answers the base rate of every resource on a new lowlands fief', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana.cookie)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect({
      wood: resources.wood.ratePerHour,
      stone: resources.stone.ratePerHour,
      iron: resources.iron.ratePerHour,
      gold: resources.gold.ratePerHour,
      food: resources.food.ratePerHour,
    }).toEqual({ wood: 10, stone: 10, iron: 5, gold: 2, food: 15 })
  })

  const sawmillLevelOne = {
    level: 1,
    cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
    durationSeconds: 120,
    peasants: 1,
  }

  const buildSawmillAt = async (level: number): Promise<void> =>
    runSql(`INSERT INTO fief_buildings (fief_id, building, level)
      SELECT id, 'sawmill'::building, ${level} FROM fiefs`)

  it('answers each building with the cost, duration and peasants of its next level', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana.cookie)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill).toEqual({ level: 0, nextLevel: sawmillLevelOne })
    expect(Object.values(buildings).map((building) => building.nextLevel?.level)).toEqual([
      1, 1, 1, 1, 1, 1,
    ])
  })

  it('answers the library at level zero with the cost of its first level', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana.cookie)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.library).toEqual({
      level: 0,
      nextLevel: {
        level: 1,
        cost: { wood: 120, stone: 160, iron: 40, gold: 0, food: 0 },
        durationSeconds: 300,
        peasants: 1,
      },
    })
  })

  it('answers no next level for a building at the top of its catalog', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await buildSawmillAt(10)

    const response = await fiefOf(ana.cookie)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill).toEqual({ level: 10, nextLevel: null })
  })

  it('charges the peasants of the next level as the increase over the current occupancy', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await buildSawmillAt(1)

    const response = await fiefOf(ana.cookie)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill.nextLevel).toEqual({
      level: 2,
      cost: { wood: 90, stone: 23, iron: 0, gold: 0, food: 0 },
      durationSeconds: 192,
      peasants: 1,
    })
  })

  it('refuses to answer another player fief', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await app.request(`/fief?playerId=${ana.playerId}`, {
      headers: { cookie: bruno.cookie },
    })

    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.name).toBe('Robledal')
    expect(overview.coordinates).toEqual({ kingdom: 1, province: 1, plot: 2 })
  })

  it('applies a finished upgrade on the read and persists it', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana.playerId)
    clock.advanceMinutes(3)

    const response = await fiefOf(ana.cookie)

    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.buildings.sawmill.level).toBe(1)
    expect(overview.resources.wood.ratePerHour).toBe(40)
    expect(overview.slot).toEqual({ kind: 'idle' })
    const stored = await server.fiefs.fiefOf(ana.playerId)
    expect(stored.ok && stored.value?.buildingLevels.sawmill).toBe(1)
    expect(stored.ok && stored.value?.slot).toEqual({ kind: 'idle' })
  })

  it('applies a finished study on the read and persists it', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await runSql(
      `UPDATE fiefs SET study_art = 'smithing', study_level = 1,
         study_started_at = '2026-09-22T08:00:00Z', study_finishes_at = '2026-09-22T08:30:00Z',
         study_cost_wood = 120, study_cost_stone = 80, study_cost_iron = 150, study_cost_gold = 60`,
    )
    clock.advanceMinutes(60)

    const response = await fiefOf(ana.cookie)

    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.resources.iron.ratePerHour).toBe(5.25)
    const stored = await server.fiefs.fiefOf(ana.playerId)
    expect(stored.ok && stored.value?.artLevels).toEqual({ smithing: 1, masonry: 0 })
    expect(stored.ok && stored.value?.studySlot).toEqual({ kind: 'idle' })
  })

  it('writes the finish a read applied at its finish instant', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana.playerId)
    clock.advanceMinutes(3)

    await fiefOf(ana.cookie)

    expect(await storedEvents()).toEqual([
      {
        kind: 'upgrade_finished',
        building: 'sawmill',
        art: null,
        level: 1,
        refund: [0, 0, 0, 0, 0],
        occurredAt: '2026-09-22T08:02:00Z',
      },
    ])
  })

  it('answers amounts that match the accrual formula for the elapsed time', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes(90)

    const response = await fiefOf(ana.cookie)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.food).toEqual({ amount: 322, ratePerHour: 15, capacity: 1000 })
    expect(resources.wood).toEqual({ amount: 515, ratePerHour: 10, capacity: 1000 })
  })

  it('answers a stock above the capacity unchanged after an hour', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await runSql('UPDATE fiefs SET wood = 1200')
    clock.advanceMinutes(60)

    const response = await fiefOf(ana.cookie)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.wood).toEqual({ amount: 1200, ratePerHour: 10, capacity: 1000 })
  })

  it('answers a finished upgrade with the amounts accrued at the old rate then the new one', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana.playerId)
    clock.advanceMinutes(90)

    const response = await fiefOf(ana.cookie)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.wood.amount).toBe(498)
  })

  it('answers the stored fief to a read whose instant is earlier than the stored one', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana.playerId)
    const laggingClock = movableClock()
    const laggingApp = createApp({ ...server, clock: laggingClock })
    clock.advanceMinutes(5)
    laggingClock.advanceMinutes(3)
    await fiefOf(ana.cookie)

    const response = await laggingApp.request('/fief', { headers: { cookie: ana.cookie } })

    expect(response.status).toBe(200)
    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.readAt).toBe('2026-09-22T08:05:00.000Z')
    expect(overview.resources.wood.amount).toBe(442)
  })

  it('answers 404 with FiefNotFound when the player holds no fief', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await runSql('TRUNCATE fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events')

    const response = await fiefOf(ana.cookie)

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
  })

  it('reads a fief with nothing to resolve in one round trip to the store', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana.playerId)
    clock.advanceMinutes(1)
    const statements: Array<string> = []
    const query = Client.prototype.query
    vi.spyOn(Client.prototype, 'query').mockImplementation(function (
      this: Client,
      ...parameters: Parameters<typeof query>
    ) {
      statements.push(statementTextOf(parameters[0]))
      return Reflect.apply(query, this, parameters)
    })

    await fiefOf(ana.cookie)

    const fiefStatements = statements.filter((statement) => statement.includes('from "fiefs"'))
    expect(fiefStatements).toHaveLength(1)
    expect(statements.filter((statement) => !statement.includes('"sessions"'))).toEqual(
      fiefStatements,
    )
  })

  it('answers 401 without a session', async () => {
    const response = await app.request('/fief')

    expect(response.status).toBe(401)
  })

  describe('the chronicle route', () => {
    const chronicleOf = async (cookie: string): Promise<Response> =>
      app.request('/fief/events', { headers: { cookie } })

    it('answers an empty chronicle for a new fief', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await chronicleOf(ana.cookie)

      expect(response.status).toBe(200)
      expect(FiefChronicleSchema.parse(await response.json())).toEqual({ events: [] })
    })

    it('lists a finish that no read had applied yet', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(
        `UPDATE fiefs SET slot_building = 'sawmill', slot_level = 1,
           slot_started_at = '2026-09-22T08:00:00Z', slot_finishes_at = '2026-09-22T08:02:00Z',
           slot_cost_wood = 60, slot_cost_stone = 15`,
      )
      clock.advanceMinutes(3)

      const response = await chronicleOf(ana.cookie)

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'upgradeFinished',
          building: 'sawmill',
          level: 1,
          occurredAt: '2026-09-22T08:02:00.000Z',
        },
      ])
    })

    it('answers a cancel with the cost it refunded', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'ironMine')
      clock.advanceMinutes(1)
      await app.request('/fief/upgrades/ironMine/1', {
        method: 'DELETE',
        headers: { cookie: ana.cookie },
      })

      const response = await chronicleOf(ana.cookie)

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'upgradeCancelled',
          building: 'ironMine',
          level: 1,
          occurredAt: '2026-09-22T08:01:00.000Z',
          refund: { wood: 90, stone: 70, iron: 20, gold: 0, food: 0 },
        },
      ])
    })

    it('answers the chronicle newest first', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      clock.advanceMinutes(3)
      await enqueue(ana.cookie, 'quarry')
      clock.advanceMinutes(1)
      await app.request('/fief/upgrades/quarry/1', {
        method: 'DELETE',
        headers: { cookie: ana.cookie },
      })

      const response = await chronicleOf(ana.cookie)

      const events = FiefChronicleSchema.parse(await response.json()).events
      expect(events.map(({ kind, occurredAt }) => ({ kind, occurredAt }))).toEqual([
        { kind: 'upgradeCancelled', occurredAt: '2026-09-22T08:04:00.000Z' },
        { kind: 'upgradeFinished', occurredAt: '2026-09-22T08:02:00.000Z' },
      ])
    })

    it('answers 404 with FiefNotFound when the player holds no fief', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql('TRUNCATE fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events')

      const response = await chronicleOf(ana.cookie)

      expect(response.status).toBe(404)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
    })

    it('answers 401 without a session', async () => {
      const response = await app.request('/fief/events')

      expect(response.status).toBe(401)
    })
  })

  describe('the enqueue route', () => {
    it('starts an upgrade and answers the fief with a busy slot', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      clock.advanceMinutes(10)

      const response = await enqueue(ana.cookie, 'sawmill')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toEqual({
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: '2026-09-22T08:10:00.000Z',
        finishesAt: '2026-09-22T08:12:00.000Z',
      })
      expect(overview.resources.wood.amount).toBe(441)
      expect(overview.resources.stone.amount).toBe(486)
      expect(overview.readAt).toBe('2026-09-22T08:10:00.000Z')
    })

    it('starts a library upgrade in the idle slot', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await enqueue(ana.cookie, 'library')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toEqual({
        kind: 'busy',
        building: 'library',
        targetLevel: 1,
        startedAt: '2026-09-22T08:00:00.000Z',
        finishesAt: '2026-09-22T08:05:00.000Z',
      })
    })

    it('queues a library upgrade behind the busy slot', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')

      const response = await enqueue(ana.cookie, 'library')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.queue.entries).toEqual([
        {
          building: 'library',
          targetLevel: 1,
          startsAt: '2026-09-22T08:02:00.000Z',
          finishesAt: '2026-09-22T08:07:00.000Z',
        },
      ])
    })

    it('answers the instant the upgrade started on a later read', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      clock.advanceMinutes(10)
      await enqueue(ana.cookie, 'sawmill')
      clock.advanceMinutes(1)

      const response = await app.request('/fief', { headers: { cookie: ana.cookie } })

      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.readAt).toBe('2026-09-22T08:11:00.000Z')
      expect(overview.slot.kind === 'busy' && overview.slot.startedAt).toBe(
        '2026-09-22T08:10:00.000Z',
      )
    })

    it('chains each waiting upgrade after the one before it', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'sawmill')

      const response = await enqueue(ana.cookie, 'quarry')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.queue.entries).toEqual([
        {
          building: 'sawmill',
          targetLevel: 2,
          startsAt: '2026-09-22T08:02:00.000Z',
          finishesAt: '2026-09-22T08:05:12.000Z',
        },
        {
          building: 'quarry',
          targetLevel: 1,
          startsAt: '2026-09-22T08:05:12.000Z',
          finishesAt: '2026-09-22T08:07:42.000Z',
        },
      ])
    })

    it('answers the next level of a building after its waiting upgrades', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'sawmill')

      const response = await fiefOf(ana.cookie)

      const { buildings, peasants } = FiefOverviewSchema.parse(await response.json())
      expect(buildings.sawmill).toEqual({
        level: 0,
        nextLevel: {
          level: 3,
          cost: { wood: 135, stone: 34, iron: 0, gold: 0, food: 0 },
          durationSeconds: 307,
          peasants: 1,
        },
      })
      expect(peasants).toEqual({
        supplied: 10,
        occupied: 0,
        free: 10,
        projectedSupplied: 10,
        projectedOccupied: 2,
        projectedFree: 8,
      })
    })

    it('answers the peasants a waiting farm will supply', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'farm')

      const response = await fiefOf(ana.cookie)

      const { peasants } = FiefOverviewSchema.parse(await response.json())
      expect(peasants).toEqual({
        supplied: 10,
        occupied: 0,
        free: 10,
        projectedSupplied: 15,
        projectedOccupied: 2,
        projectedFree: 13,
      })
    })

    it('refuses an upgrade when the queue is full', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      for (const building of ['sawmill', 'sawmill', 'quarry', 'farm', 'ironMine']) {
        expect((await enqueue(ana.cookie, building)).status).toBe(200)
      }
      const before = await server.fiefs.fiefOf(ana.playerId)

      const response = await enqueue(ana.cookie, 'warehouse')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'QueueFull',
        message: 'Ya no caben más obras en espera. Espera a que avance alguna.',
      })
      expect(await server.fiefs.fiefOf(ana.playerId)).toEqual(before)
    })

    it('applies three queued upgrades on the first read after they all finished', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      for (const building of ['sawmill', 'quarry', 'farm']) {
        expect((await enqueue(ana.cookie, building)).status).toBe(200)
      }
      const statements: Array<string> = []
      const query = Client.prototype.query
      vi.spyOn(Client.prototype, 'query').mockImplementation(function (
        this: Client,
        ...parameters: Parameters<typeof query>
      ) {
        statements.push(statementTextOf(parameters[0]))
        return Reflect.apply(query, this, parameters)
      })
      clock.advanceMinutes(7.5)
      const statementsBeforeRead = [...statements]

      const response = await fiefOf(ana.cookie)

      expect(statementsBeforeRead).toEqual([])
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.readAt).toBe('2026-09-22T08:07:30.000Z')
      expect(overview.buildings.sawmill.level).toBe(1)
      expect(overview.buildings.quarry.level).toBe(1)
      expect(overview.buildings.farm.level).toBe(1)
      expect(overview.slot).toEqual({ kind: 'idle' })
      expect(overview.queue.entries).toEqual([])
      expect(
        Object.fromEntries(
          Object.entries(overview.resources).map(([resource, { amount }]) => [resource, amount]),
        ),
      ).toEqual({ wood: 322, stone: 441, iron: 200, gold: 50, food: 300 })
    })

    it('refuses an upgrade the free peasants cannot staff', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, building, level FROM fiefs,
        (VALUES ('sawmill'::building, 4), ('quarry'::building, 3), ('iron_mine'::building, 3)) AS levels (building, level)`)

      const response = await enqueue(ana.cookie, 'warehouse')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'NotEnoughPeasants',
        message: 'No tienes campesinos libres suficientes para esa obra.',
      })
    })

    it('leaves the stored fief unchanged when it refuses', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await runSql('UPDATE fiefs SET wood = 0')
      const before = await server.fiefs.fiefOf(ana.playerId)
      clock.advanceMinutes(3)

      const response = await enqueue(ana.cookie, 'quarry')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InsufficientResources')
      expect(await server.fiefs.fiefOf(ana.playerId)).toEqual(before)
    })

    it('completes a finished upgrade and starts the next one in the same call', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      clock.advanceMinutes(3)

      const response = await enqueue(ana.cookie, 'quarry')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.buildings.sawmill.level).toBe(1)
      expect(overview.slot).toEqual({
        kind: 'busy',
        building: 'quarry',
        targetLevel: 1,
        startedAt: '2026-09-22T08:03:00.000Z',
        finishesAt: '2026-09-22T08:05:30.000Z',
      })
      const stored = await server.fiefs.fiefOf(ana.playerId)
      expect(stored.ok && stored.value?.buildingLevels.sawmill).toBe(1)
      expect(stored.ok && stored.value?.slot.kind).toBe('busy')
    })

    it('refuses by name an upgrade whose instant is earlier than the stored one', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const laggingClock = movableClock()
      const laggingApp = createApp({ ...server, clock: laggingClock })
      clock.advanceMinutes(5)
      laggingClock.advanceMinutes(3)
      await enqueue(ana.cookie, 'sawmill')
      await runSql('UPDATE fiefs SET wood = 0')

      const response = await laggingApp.request('/fief/upgrades', {
        method: 'POST',
        headers: { cookie: ana.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ building: 'quarry' }),
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InsufficientResources')
    })

    it('answers 400 to a building the wire does not name', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await enqueue(ana.cookie, 'castle')

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request('/fief/upgrades', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ building: 'sawmill' }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the cancel route', () => {
    const cancel = async (
      cookie: string,
      building: string,
      targetLevel: string | number,
    ): Promise<Response> =>
      app.request(`/fief/upgrades/${building}/${targetLevel}`, {
        method: 'DELETE',
        headers: { cookie },
      })

    it('cancels the upgrade in progress and answers the fief with the slot idle', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueueSawmill(ana.playerId)
      clock.advanceMinutes(1)

      const response = await cancel(ana.cookie, 'sawmill', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toEqual({ kind: 'idle' })
      expect(overview.buildings.sawmill.level).toBe(0)
      expect(overview.resources.wood.amount).toBe(500)
      expect(overview.resources.stone.amount).toBe(500)
      expect(overview.readAt).toBe('2026-09-22T08:01:00.000Z')
      const stored = await server.fiefs.fiefOf(ana.playerId)
      expect(stored.ok && stored.value?.slot).toEqual({ kind: 'idle' })
      expect(stored.ok && stored.value?.stocks.wood).toBe(500)
    })

    it('writes the cancel with its refund', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueueSawmill(ana.playerId)
      clock.advanceMinutes(1)

      await cancel(ana.cookie, 'sawmill', 1)

      expect(await storedEvents()).toEqual([
        {
          kind: 'upgrade_cancelled',
          building: 'sawmill',
          art: null,
          level: 1,
          refund: [60, 15, 0, 0, 0],
          occurredAt: '2026-09-22T08:01:00Z',
        },
      ])
    })

    it('writes no event when the cancel is refused', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueueSawmill(ana.playerId)
      clock.advanceMinutes(3)

      const response = await cancel(ana.cookie, 'sawmill', 1)

      expect(response.status).toBe(409)
      expect(await storedEvents()).toEqual([])
    })

    it('cancels the upgrade in progress and answers the next one started at the cancel instant', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'quarry')
      clock.advanceMinutes(1)

      const response = await cancel(ana.cookie, 'sawmill', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toEqual({
        kind: 'busy',
        building: 'quarry',
        targetLevel: 1,
        startedAt: '2026-09-22T08:01:00.000Z',
        finishesAt: '2026-09-22T08:03:30.000Z',
      })
      expect(overview.queue.entries).toEqual([])
    })

    it('cancels a waiting entry and answers the queue with the gap closed', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'quarry')
      await enqueue(ana.cookie, 'farm')

      const response = await cancel(ana.cookie, 'quarry', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toMatchObject({ building: 'sawmill', targetLevel: 1 })
      expect(overview.queue.entries).toEqual([
        {
          building: 'farm',
          targetLevel: 1,
          startsAt: '2026-09-22T08:02:00.000Z',
          finishesAt: '2026-09-22T08:04:00.000Z',
        },
      ])
    })

    it('cancels in cascade the waiting level above a cancelled waiting one', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'quarry')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'sawmill')

      const response = await cancel(ana.cookie, 'sawmill', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toMatchObject({ building: 'quarry', targetLevel: 1 })
      expect(overview.queue.entries).toEqual([])
      expect(overview.buildings.sawmill.nextLevel?.level).toBe(1)
      expect(overview.resources.wood.amount).toBe(450)
      expect(overview.resources.stone.amount).toBe(475)
      const stored = await server.fiefs.fiefOf(ana.playerId)
      expect(stored.ok && stored.value?.buildQueue).toEqual([])
    })

    it('answers 409 with UpgradeNotFound to an upgrade that finished before the cancel', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'quarry')
      await enqueue(ana.cookie, 'farm')
      clock.advanceMinutes(3)

      const response = await cancel(ana.cookie, 'sawmill', 1)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'UpgradeNotFound',
        message: 'Esa obra ya no está en tu cola. No queda nada que cancelar.',
      })
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana.cookie)).json())
      expect(overview.buildings.sawmill.level).toBe(1)
      expect(overview.slot).toMatchObject({ building: 'quarry', targetLevel: 1 })
      expect(overview.queue.entries).toMatchObject([{ building: 'farm', targetLevel: 1 }])
    })

    it('cancels by name the upgrade that moved into the slot before the cancel', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      await enqueue(ana.cookie, 'quarry')
      await enqueue(ana.cookie, 'farm')
      clock.advanceMinutes(3)

      const response = await cancel(ana.cookie, 'quarry', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.buildings.sawmill.level).toBe(1)
      expect(overview.buildings.quarry.level).toBe(0)
      expect(overview.slot).toEqual({
        kind: 'busy',
        building: 'farm',
        targetLevel: 1,
        startedAt: '2026-09-22T08:03:00.000Z',
        finishesAt: '2026-09-22T08:05:00.000Z',
      })
      expect(overview.queue.entries).toEqual([])
    })

    it('answers 400 to an entry the wire does not name', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueueSawmill(ana.playerId)

      const responses = await Promise.all([
        cancel(ana.cookie, 'castle', 1),
        cancel(ana.cookie, 'sawmill', 0),
        cancel(ana.cookie, 'sawmill', 'uno'),
      ])

      expect(responses.map(({ status }) => status)).toEqual([400, 400, 400])
    })

    it('answers 401 without a session', async () => {
      const response = await app.request('/fief/upgrades/sawmill/1', { method: 'DELETE' })

      expect(response.status).toBe(401)
    })
  })
  describe('the study route', () => {
    const study = async (cookie: string, art: string): Promise<Response> =>
      app.request('/fief/studies', {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ art }),
      })

    const buildLibraryAt = async (level: number): Promise<void> =>
      runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, 'library'::building, ${level} FROM fiefs`)

    it('starts a study and answers the fief with the study slot busy', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildLibraryAt(1)
      await runSql('UPDATE fiefs SET gold = 100')
      clock.advanceMinutes(10)

      const response = await study(ana.cookie, 'smithing')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.study).toEqual({
        kind: 'busy',
        art: 'smithing',
        targetLevel: 1,
        startedAt: '2026-09-22T08:10:00.000Z',
        finishesAt: '2026-09-22T08:25:00.000Z',
      })
      expect(overview.resources.gold.amount).toBe(40)
      expect(overview.slot).toEqual({ kind: 'idle' })
      const stored = await server.fiefs.fiefOf(ana.playerId)
      expect(stored.ok && stored.value?.studySlot.kind).toBe('busy')
    })

    it('refuses a study without a library', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql('UPDATE fiefs SET gold = 100')
      const before = await server.fiefs.fiefOf(ana.playerId)

      const response = await study(ana.cookie, 'smithing')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('LibraryLevelTooLow')
      expect(await server.fiefs.fiefOf(ana.playerId)).toEqual(before)
    })

    it('refuses a second study while one runs', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildLibraryAt(1)
      await runSql('UPDATE fiefs SET gold = 1000')
      expect((await study(ana.cookie, 'smithing')).status).toBe(200)

      const response = await study(ana.cookie, 'masonry')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('StudySlotBusy')
    })

    it('answers the shortened duration of the next art level', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildLibraryAt(2)

      const response = await fiefOf(ana.cookie)

      const { arts, study: studySlot } = FiefOverviewSchema.parse(await response.json())
      expect(studySlot).toEqual({ kind: 'idle' })
      expect(arts.smithing).toEqual({
        level: 0,
        resource: 'iron',
        ratePercent: 0,
        nextLevel: {
          level: 1,
          cost: { wood: 120, stone: 80, iron: 150, gold: 60, food: 0 },
          durationSeconds: 600,
          requiredLibraryLevel: 1,
          ratePercent: 5,
        },
      })
    })

    it('names the resource each art raises', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await fiefOf(ana.cookie)

      const { arts } = FiefOverviewSchema.parse(await response.json())
      expect(arts.smithing.resource).toBe('iron')
      expect(arts.masonry.resource).toBe('stone')
    })

    it('answers 400 to an art the wire does not name', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await study(ana.cookie, 'alchemy')

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request('/fief/studies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ art: 'smithing' }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the study cancel route', () => {
    const cancelStudy = async (
      cookie: string,
      art: string,
      targetLevel: string | number,
    ): Promise<Response> =>
      app.request(`/fief/studies/${art}/${targetLevel}`, {
        method: 'DELETE',
        headers: { cookie },
      })

    const studySmithingAtMinuteTen = async (cookie: string): Promise<void> => {
      await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, 'library'::building, 1 FROM fiefs`)
      await runSql('UPDATE fiefs SET gold = 100')
      clock.advanceMinutes(10)
      const started = await app.request('/fief/studies', {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ art: 'smithing' }),
      })
      expect(started.status).toBe(200)
    }

    it('cancels the study and answers the fief with the study slot idle', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await studySmithingAtMinuteTen(ana.cookie)
      clock.advanceMinutes(1)

      const response = await cancelStudy(ana.cookie, 'smithing', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.study).toEqual({ kind: 'idle' })
      expect(overview.arts.smithing.level).toBe(0)
      expect(overview.resources.gold.amount).toBe(100)
      expect(overview.readAt).toBe('2026-09-22T08:11:00.000Z')
      const stored = await server.fiefs.fiefOf(ana.playerId)
      expect(stored.ok && stored.value?.studySlot).toEqual({ kind: 'idle' })
      expect(stored.ok && stored.value?.stocks.gold).toBe(100)
    })

    it('applies a study that finished before the cancel and refuses with StudyNotFound', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await studySmithingAtMinuteTen(ana.cookie)
      await runSql(`UPDATE fiefs SET study_finishes_at = '2026-09-22T08:12:00Z'`)
      clock.advanceMinutes(3)

      const response = await cancelStudy(ana.cookie, 'smithing', 1)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'StudyNotFound',
        message: 'La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.',
      })
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana.cookie)).json())
      expect(overview.arts.smithing.level).toBe(1)
      expect(overview.study).toEqual({ kind: 'idle' })
    })

    it('answers 400 to a target level that is not a whole count from one', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await cancelStudy(ana.cookie, 'smithing', 0)

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request('/fief/studies/smithing/1', { method: 'DELETE' })

      expect(response.status).toBe(401)
    })
  })
})

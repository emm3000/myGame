import { fileURLToPath } from 'node:url'
import { ApiErrorSchema, FiefOverviewSchema, PlayerSchema } from '@mygame/contracts'
import { type Clock, enqueueBuilding, Instant, type PlayerId } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'

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
    server = composeServer({ API_PORT: '3194', DATABASE_URL: databaseUrl() }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql('TRUNCATE players, sessions, fiefs, fief_buildings')
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

  it('answers the fief of the signed-in player', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana.cookie)

    expect(response.status).toBe(200)
    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.name).toBe('Valdehierro')
    expect(overview.resources.wood).toEqual({ amount: 500, ratePerHour: 10, capacity: 1000 })
    expect(overview.peasants).toEqual({ supplied: 10, occupied: 0, free: 10 })
    expect(overview.slot).toEqual({ kind: 'idle' })
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
      1, 1, 1, 1, 1,
    ])
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

  it('answers amounts that match the accrual formula for the elapsed time', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes(90)

    const response = await fiefOf(ana.cookie)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.food).toEqual({ amount: 322, ratePerHour: 15, capacity: 1000 })
    expect(resources.wood).toEqual({ amount: 515, ratePerHour: 10, capacity: 1000 })
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
    await runSql('TRUNCATE fiefs, fief_buildings')

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

  describe('the enqueue route', () => {
    const enqueue = async (cookie: string, building: string): Promise<Response> =>
      app.request('/fief/upgrades', {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ building }),
      })

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
        finishesAt: '2026-09-22T08:12:00.000Z',
      })
      expect(overview.resources.wood.amount).toBe(441)
      expect(overview.resources.stone.amount).toBe(486)
      expect(overview.readAt).toBe('2026-09-22T08:10:00.000Z')
    })

    it('answers the next level of the built level while the upgrade runs', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await enqueue(ana.cookie, 'sawmill')

      const { buildings } = FiefOverviewSchema.parse(await response.json())
      expect(buildings.sawmill).toEqual({ level: 0, nextLevel: sawmillLevelOne })
    })

    it('refuses a second upgrade while the slot is busy', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana.cookie, 'sawmill')
      clock.advanceMinutes(1)

      const response = await enqueue(ana.cookie, 'quarry')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'SlotBusy',
        message: 'Ya tienes una obra en marcha. Espera a que termine.',
      })
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

      const response = await laggingApp.request('/fief/upgrades', {
        method: 'POST',
        headers: { cookie: ana.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ building: 'quarry' }),
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('SlotBusy')
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
})

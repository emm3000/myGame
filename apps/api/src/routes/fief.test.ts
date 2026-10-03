import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  type FiefChronicle,
  FiefChronicleSchema,
  FiefListSchema,
  type FiefOverview,
  FiefOverviewSchema,
  PlayerSchema,
  ProvinceMapSchema,
} from '@mygame/contracts'
import {
  type Clock,
  Coordinates,
  campOf,
  enqueueBuilding,
  Fief,
  type FiefId,
  FiefName,
  Instant,
  type PlayerId,
} from '@mygame/domain'
import { Client } from 'pg'
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
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

type AttackedMarch = Extract<NonNullable<FiefOverview['march']>, { order: 'attack' }>

type SentAttack = {
  readonly lord: Lord
  readonly sent: AttackedMarch
}

type SignedUpPlayer = {
  readonly cookie: string
  readonly playerId: PlayerId
  readonly fiefId: FiefId
}

type Lord = Pick<SignedUpPlayer, 'cookie' | 'fiefId'>

const unknownFiefId = '6d1f0c3a-2b4e-4c5d-9e8f-7a6b5c4d3e2f'

const pathOf = (lord: Lord, path: string): string => `/fiefs/${lord.fiefId}${path}`

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
      'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
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
    const cookie = sessionCookieOf(response)
    const fiefs = await app.request('/fiefs', { headers: { cookie } })
    const [fief] = FiefListSchema.parse(await fiefs.json()).fiefs
    assert(fief !== undefined)
    return { cookie, playerId: player.id, fiefId: fief.id }
  }

  const storedFiefOf = async ({ fiefId }: SignedUpPlayer) => server.fiefs.fiefOf(fiefId)

  const enqueueSawmill = async ({ playerId, fiefId }: SignedUpPlayer): Promise<void> => {
    const enqueued = await server.inTransaction(({ fiefs }) =>
      enqueueBuilding(
        { playerId, fiefId, building: 'sawmill' },
        { fiefs, catalog: server.buildingCatalog, clock },
      ),
    )
    expect(enqueued.ok).toBe(true)
  }

  const fiefOf = async (lord: Lord): Promise<Response> =>
    app.request(pathOf(lord, ''), { headers: { cookie: lord.cookie } })

  const provinceTwoPlotWhere = (isWanted: (tier: number | undefined) => boolean): number => {
    const { camps } = server.buildingCatalog.fiefSettings()
    const plot = Array.from({ length: 15 }, (_, index) => index + 1).find((candidate) =>
      isWanted(campOf({ kingdom: 1, province: 2, plot: candidate }, camps)?.tier),
    )
    assert(plot !== undefined)
    return plot
  }

  const campPlotOfTier = (tier: number): number =>
    provinceTwoPlotWhere((campTier) => campTier === tier)

  const enqueue = async (lord: Lord, building: string): Promise<Response> =>
    app.request(pathOf(lord, '/upgrades'), {
      method: 'POST',
      headers: { cookie: lord.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ building }),
    })

  it('answers the fief of the signed-in player', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana)

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
      lowestFree: 10,
    })
    expect(overview.slot).toEqual({ kind: 'idle' })
    expect(overview.queue).toEqual({ entries: [], cap: 4 })
    expect(overview.readAt).toBe('2026-09-22T08:00:00.000Z')
  })

  it('answers the base rate of every resource on a new lowlands fief', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana)

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

    const response = await fiefOf(ana)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill).toEqual({ level: 0, nextLevel: sawmillLevelOne })
    expect(Object.values(buildings).map((building) => building.nextLevel?.level)).toEqual([
      1, 1, 1, 1, 1, 1, 1,
    ])
  })

  it('answers the library at level zero with the cost of its first level', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana)

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

    const response = await fiefOf(ana)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill).toEqual({ level: 10, nextLevel: null })
  })

  it('charges the peasants of the next level as the increase over the current occupancy', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await buildSawmillAt(1)

    const response = await fiefOf(ana)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill.nextLevel).toEqual({
      level: 2,
      cost: { wood: 90, stone: 23, iron: 0, gold: 0, food: 0 },
      durationSeconds: 192,
      peasants: 1,
    })
  })

  it('answers the overview of a fief by its id', async () => {
    await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await fiefOf(bruno)

    expect(response.status).toBe(200)
    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.id).toBe(bruno.fiefId)
    expect(overview.name).toBe('Robledal')
    expect(overview.coordinates).toEqual({ kingdom: 1, province: 1, plot: 2 })
  })

  it('refuses the fief of another player with 404', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await fiefOf({ cookie: bruno.cookie, fiefId: ana.fiefId })

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
  })

  it('answers 400 for a fief id that is not a uuid', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf({ cookie: ana.cookie, fiefId: 'valdehierro' })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })

  it('applies a finished upgrade on the read and persists it', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana)
    clock.advanceMinutes(3)

    const response = await fiefOf(ana)

    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.buildings.sawmill.level).toBe(1)
    expect(overview.resources.wood.ratePerHour).toBe(40)
    expect(overview.slot).toEqual({ kind: 'idle' })
    const stored = await storedFiefOf(ana)
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

    const response = await fiefOf(ana)

    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.resources.iron.ratePerHour).toBe(5.25)
    const stored = await storedFiefOf(ana)
    expect(stored.ok && stored.value?.artLevels).toEqual({ smithing: 1, masonry: 0 })
    expect(stored.ok && stored.value?.studySlot).toEqual({ kind: 'idle' })
  })

  it('writes the finish a read applied at its finish instant', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana)
    clock.advanceMinutes(3)

    await fiefOf(ana)

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

    const response = await fiefOf(ana)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.food).toEqual({ amount: 322, ratePerHour: 15, capacity: 1000 })
    expect(resources.wood).toEqual({ amount: 515, ratePerHour: 10, capacity: 1000 })
  })

  it('answers no season before the epoch', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf(ana)

    const { season } = FiefOverviewSchema.parse(await response.json())
    expect(season).toBeNull()
  })

  const minutesToFirstAutumnRead =
    (Date.parse('2026-10-20T08:00:00Z') - signedUpAt) / millisecondsPerMinute

  it('answers autumn of year 1 and the instant it ends', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes(minutesToFirstAutumnRead)

    const response = await fiefOf(ana)

    const { season } = FiefOverviewSchema.parse(await response.json())
    expect(season).toMatchObject({ kind: 'autumn', year: 1, endsAt: '2026-10-26T00:00:00.000Z' })
  })

  it('answers the autumn gold rate raised by its multiplier', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes(minutesToFirstAutumnRead)

    const response = await fiefOf(ana)

    const { resources, season } = FiefOverviewSchema.parse(await response.json())
    expect(season?.multiplierPercent.gold).toBe(125)
    expect(resources.gold.ratePerHour).toBe(2.5)
  })

  it('answers the winter food rate lowered by its multiplier', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const minutesToFirstWinter =
      (Date.parse('2026-10-26T00:00:00Z') - signedUpAt) / millisecondsPerMinute
    const minutesWithinTheSession = 20 * 24 * 60
    clock.advanceMinutes(minutesWithinTheSession)
    await fiefOf(ana)
    clock.advanceMinutes(minutesToFirstWinter - minutesWithinTheSession + 60)

    const response = await fiefOf(ana)

    const { resources, season } = FiefOverviewSchema.parse(await response.json())
    expect(season?.kind).toBe('winter')
    expect(season?.multiplierPercent.food).toBe(75)
    expect(resources.food.ratePerHour).toBe(11.25)
  })

  it('answers the summer duration of the next sawmill level', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes((Date.parse('2026-10-13T08:00:00Z') - signedUpAt) / millisecondsPerMinute)

    const response = await fiefOf(ana)

    const { buildings } = FiefOverviewSchema.parse(await response.json())
    expect(buildings.sawmill.nextLevel?.durationSeconds).toBe(90)
  })

  it('answers the summer build percent', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes((Date.parse('2026-10-14T08:00:00Z') - signedUpAt) / millisecondsPerMinute)

    const response = await fiefOf(ana)

    const { season } = FiefOverviewSchema.parse(await response.json())
    expect(season?.kind).toBe('summer')
    expect(season?.durationPercent).toEqual({ build: 75, study: 100, train: 100, road: 100 })
  })

  it('answers the spring train percent', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes((Date.parse('2026-10-07T08:00:00Z') - signedUpAt) / millisecondsPerMinute)

    const response = await fiefOf(ana)

    const { season } = FiefOverviewSchema.parse(await response.json())
    expect(season?.kind).toBe('spring')
    expect(season?.durationPercent).toEqual({ build: 100, study: 100, train: 75, road: 100 })
  })

  it('answers the winter study percent', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const minutesToWinterRead =
      (Date.parse('2026-10-28T08:00:00Z') - signedUpAt) / millisecondsPerMinute
    const minutesWithinTheSession = 20 * 24 * 60
    clock.advanceMinutes(minutesWithinTheSession)
    await fiefOf(ana)
    clock.advanceMinutes(minutesToWinterRead - minutesWithinTheSession)

    const response = await fiefOf(ana)

    const { season } = FiefOverviewSchema.parse(await response.json())
    expect(season?.kind).toBe('winter')
    expect(season?.durationPercent).toEqual({ build: 100, study: 75, train: 100, road: 100 })
  })

  it('answers the road percent of autumn', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    clock.advanceMinutes(minutesToFirstAutumnRead)

    const response = await fiefOf(ana)

    const { season } = FiefOverviewSchema.parse(await response.json())
    expect(season?.kind).toBe('autumn')
    expect(season?.durationPercent).toEqual({ build: 100, study: 100, train: 100, road: 75 })
  })

  it('answers a stock above the capacity unchanged after an hour', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await runSql('UPDATE fiefs SET wood = 1200')
    clock.advanceMinutes(60)

    const response = await fiefOf(ana)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.wood).toEqual({ amount: 1200, ratePerHour: 10, capacity: 1000 })
  })

  it('answers a finished upgrade with the amounts accrued at the old rate then the new one', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana)
    clock.advanceMinutes(90)

    const response = await fiefOf(ana)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.wood.amount).toBe(498)
  })

  it('answers the stored fief to a read whose instant is earlier than the stored one', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana)
    const laggingClock = movableClock()
    const laggingApp = createApp({ ...server, clock: laggingClock })
    clock.advanceMinutes(5)
    laggingClock.advanceMinutes(3)
    await fiefOf(ana)

    const response = await laggingApp.request(pathOf(ana, ''), { headers: { cookie: ana.cookie } })

    expect(response.status).toBe(200)
    const overview = FiefOverviewSchema.parse(await response.json())
    expect(overview.readAt).toBe('2026-09-22T08:05:00.000Z')
    expect(overview.resources.wood.amount).toBe(442)
  })

  it('answers 404 with FiefNotFound for an unknown fief id', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await fiefOf({ cookie: ana.cookie, fiefId: unknownFiefId })

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
  })

  it('reads a fief with nothing to resolve in one round trip to the store', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana)
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

    await fiefOf(ana)

    const fiefStatements = statements.filter((statement) => statement.includes('from "fiefs"'))
    expect(fiefStatements).toHaveLength(1)
    expect(statements.filter((statement) => !statement.includes('"sessions"'))).toEqual(
      fiefStatements,
    )
  })

  it('answers 401 without a session', async () => {
    const response = await app.request(`/fiefs/${unknownFiefId}`)

    expect(response.status).toBe(401)
  })

  describe('the chronicle route', () => {
    const chronicleOf = async (lord: Lord): Promise<Response> =>
      app.request(pathOf(lord, '/events'), { headers: { cookie: lord.cookie } })

    it('lists the chronicle of the fief named in the path', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const bruno = await signUp('bruno@example.com', 'Robledal')
      await enqueue(bruno, 'sawmill')
      clock.advanceMinutes(3)

      const anaChronicle = await chronicleOf(ana)
      const brunoChronicle = await chronicleOf(bruno)

      expect(FiefChronicleSchema.parse(await anaChronicle.json()).events).toEqual([])
      expect(FiefChronicleSchema.parse(await brunoChronicle.json()).events).toEqual([
        {
          kind: 'upgradeFinished',
          building: 'sawmill',
          level: 1,
          occurredAt: '2026-09-22T08:02:00.000Z',
        },
      ])
    })

    it('answers an empty chronicle for a new fief', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await chronicleOf(ana)

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

      const response = await chronicleOf(ana)

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'upgradeFinished',
          building: 'sawmill',
          level: 1,
          occurredAt: '2026-09-22T08:02:00.000Z',
        },
      ])
    })

    it('lists the units of an order that no read had closed yet', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(
        `INSERT INTO fief_recruit_orders (fief_id, kind, count, cost_wood, cost_stone, cost_iron,
           cost_gold, cost_food, per_unit_seconds, started_at)
         SELECT id, 'infantry', 3, 60, 0, 30, 0, 90, 60, '2026-09-22T08:00:00Z' FROM fiefs`,
      )
      clock.advanceMinutes(5)

      const response = await chronicleOf(ana)

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'recruitsDelivered',
          unit: 'infantry',
          count: 3,
          occurredAt: '2026-09-22T08:03:00.000Z',
        },
      ])
    })

    it('answers a cancel with the cost it refunded', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'ironMine')
      clock.advanceMinutes(1)
      await app.request(pathOf(ana, '/upgrades/ironMine/1'), {
        method: 'DELETE',
        headers: { cookie: ana.cookie },
      })

      const response = await chronicleOf(ana)

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

    it('answers a recruit cancel with the units kept, the units cancelled and the refund', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(
        `INSERT INTO fief_events (fief_id, kind, unit, count, cancelled_count, refund_wood,
           refund_iron, refund_food, occurred_at)
         SELECT id, 'recruits_cancelled', 'infantry', 2, 3, 60, 30, 90, '2026-09-22T08:02:30Z'
         FROM fiefs`,
      )

      const response = await chronicleOf(ana)

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'recruitsCancelled',
          unit: 'infantry',
          delivered: 2,
          cancelled: 3,
          occurredAt: '2026-09-22T08:02:30.000Z',
          refund: { wood: 60, stone: 0, iron: 30, gold: 0, food: 90 },
        },
      ])
    })

    it('answers a returned march with its plot, its infantry and its loot', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(
        `INSERT INTO fief_marches (fief_id, province, plot, infantry_count, cavalry_count, settler_count,
           stay_hours, one_way_seconds, departed_at, loot_wood, loot_stone, loot_iron, loot_gold, loot_food,
           loot_percent_wood, loot_percent_stone, loot_percent_iron, loot_percent_gold, loot_percent_food)
         SELECT id, 2, 7, 10, 0, 0, 1, 60, '2026-09-22T08:00:00Z', 30, 30, 0, 0, 0, 100, 100, 100, 100, 100
         FROM fiefs`,
      )
      clock.advanceMinutes(62)

      const response = await chronicleOf(ana)

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'marchReturned',
          province: 2,
          plot: 7,
          units: { infantry: 10, cavalry: 0, settler: 0 },
          loot: { wood: 30, stone: 30, iron: 0, gold: 0, food: 0 },
          occurredAt: '2026-09-22T09:02:00.000Z',
          recalled: false,
        },
      ])
    })

    it('answers the chronicle newest first', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      clock.advanceMinutes(3)
      await enqueue(ana, 'quarry')
      clock.advanceMinutes(1)
      await app.request(pathOf(ana, '/upgrades/quarry/1'), {
        method: 'DELETE',
        headers: { cookie: ana.cookie },
      })

      const response = await chronicleOf(ana)

      const events = FiefChronicleSchema.parse(await response.json()).events
      expect(events.map(({ kind, occurredAt }) => ({ kind, occurredAt }))).toEqual([
        { kind: 'upgradeCancelled', occurredAt: '2026-09-22T08:04:00.000Z' },
        { kind: 'upgradeFinished', occurredAt: '2026-09-22T08:02:00.000Z' },
      ])
    })

    it('answers 404 with FiefNotFound for an unknown fief id', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await chronicleOf({ cookie: ana.cookie, fiefId: unknownFiefId })

      expect(response.status).toBe(404)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/events`)

      expect(response.status).toBe(401)
    })
  })

  describe('the enqueue route', () => {
    it('enqueues an upgrade on the fief named in the path', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const bruno = await signUp('bruno@example.com', 'Robledal')

      const response = await enqueue(bruno, 'sawmill')

      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.id).toBe(bruno.fiefId)
      const brunoFief = await server.fiefs.fiefOf(bruno.fiefId)
      const anaFief = await server.fiefs.fiefOf(ana.fiefId)
      expect(brunoFief.ok && brunoFief.value?.slot.kind).toBe('busy')
      expect(anaFief.ok && anaFief.value?.slot.kind).toBe('idle')
    })

    it('starts an upgrade and answers the fief with a busy slot', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      clock.advanceMinutes(10)

      const response = await enqueue(ana, 'sawmill')

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

      const response = await enqueue(ana, 'library')

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
      await enqueue(ana, 'sawmill')

      const response = await enqueue(ana, 'library')

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

    it('queues a barracks upgrade behind the busy slot', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')

      const response = await enqueue(ana, 'barracks')

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.queue.entries).toEqual([
        {
          building: 'barracks',
          targetLevel: 1,
          startsAt: '2026-09-22T08:02:00.000Z',
          finishesAt: '2026-09-22T08:08:00.000Z',
        },
      ])
    })

    it('answers the instant the upgrade started on a later read', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      clock.advanceMinutes(10)
      await enqueue(ana, 'sawmill')
      clock.advanceMinutes(1)

      const response = await app.request(pathOf(ana, ''), { headers: { cookie: ana.cookie } })

      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.readAt).toBe('2026-09-22T08:11:00.000Z')
      expect(overview.slot.kind === 'busy' && overview.slot.startedAt).toBe(
        '2026-09-22T08:10:00.000Z',
      )
    })

    it('chains each waiting upgrade after the one before it', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'sawmill')

      const response = await enqueue(ana, 'quarry')

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
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'sawmill')

      const response = await fiefOf(ana)

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
        lowestFree: 8,
      })
    })

    it('answers the peasants a waiting farm will supply', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'farm')

      const response = await fiefOf(ana)

      const { peasants } = FiefOverviewSchema.parse(await response.json())
      expect(peasants).toEqual({
        supplied: 10,
        occupied: 0,
        free: 10,
        projectedSupplied: 15,
        projectedOccupied: 2,
        projectedFree: 13,
        lowestFree: 9,
      })
    })

    it('answers the lowest free peasants a busy upgrade leaves before a queued farm lands', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'farm')

      const response = await fiefOf(ana)

      const { peasants } = FiefOverviewSchema.parse(await response.json())
      expect(peasants.lowestFree).toBe(9)
    })

    it('refuses an upgrade when the queue is full', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      for (const building of ['sawmill', 'sawmill', 'quarry', 'farm', 'ironMine']) {
        expect((await enqueue(ana, building)).status).toBe(200)
      }
      const before = await storedFiefOf(ana)

      const response = await enqueue(ana, 'warehouse')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'QueueFull',
        message: 'Ya no caben más obras en espera. Espera a que avance alguna.',
      })
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('applies three queued upgrades on the first read after they all finished', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      for (const building of ['sawmill', 'quarry', 'farm']) {
        expect((await enqueue(ana, building)).status).toBe(200)
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

      const response = await fiefOf(ana)

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

      const response = await enqueue(ana, 'warehouse')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'NotEnoughPeasants',
        message: 'No tienes campesinos libres suficientes para esa obra.',
      })
    })

    it('leaves the stored fief unchanged when it refuses', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await runSql('UPDATE fiefs SET wood = 0')
      const before = await storedFiefOf(ana)
      clock.advanceMinutes(3)

      const response = await enqueue(ana, 'quarry')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InsufficientResources')
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('completes a finished upgrade and starts the next one in the same call', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      clock.advanceMinutes(3)

      const response = await enqueue(ana, 'quarry')

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
      const stored = await storedFiefOf(ana)
      expect(stored.ok && stored.value?.buildingLevels.sawmill).toBe(1)
      expect(stored.ok && stored.value?.slot.kind).toBe('busy')
    })

    it('refuses by name an upgrade whose instant is earlier than the stored one', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const laggingClock = movableClock()
      const laggingApp = createApp({ ...server, clock: laggingClock })
      clock.advanceMinutes(5)
      laggingClock.advanceMinutes(3)
      await enqueue(ana, 'sawmill')
      await runSql('UPDATE fiefs SET wood = 0')

      const response = await laggingApp.request(pathOf(ana, '/upgrades'), {
        method: 'POST',
        headers: { cookie: ana.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ building: 'quarry' }),
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InsufficientResources')
    })

    it('answers 400 to a building the wire does not name', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await enqueue(ana, 'castle')

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/upgrades`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ building: 'sawmill' }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the cancel route', () => {
    const cancel = async (
      lord: Lord,
      building: string,
      targetLevel: string | number,
    ): Promise<Response> =>
      app.request(`/fiefs/${lord.fiefId}/upgrades/${building}/${targetLevel}`, {
        method: 'DELETE',
        headers: { cookie: lord.cookie },
      })

    it('cancels the upgrade in progress and answers the fief with the slot idle', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueueSawmill(ana)
      clock.advanceMinutes(1)

      const response = await cancel(ana, 'sawmill', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toEqual({ kind: 'idle' })
      expect(overview.buildings.sawmill.level).toBe(0)
      expect(overview.resources.wood.amount).toBe(500)
      expect(overview.resources.stone.amount).toBe(500)
      expect(overview.readAt).toBe('2026-09-22T08:01:00.000Z')
      const stored = await storedFiefOf(ana)
      expect(stored.ok && stored.value?.slot).toEqual({ kind: 'idle' })
      expect(stored.ok && stored.value?.stocks.wood).toBe(500)
    })

    it('writes the cancel with its refund', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueueSawmill(ana)
      clock.advanceMinutes(1)

      await cancel(ana, 'sawmill', 1)

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
      await enqueueSawmill(ana)
      clock.advanceMinutes(3)

      const response = await cancel(ana, 'sawmill', 1)

      expect(response.status).toBe(409)
      expect(await storedEvents()).toEqual([])
    })

    it('cancels the upgrade in progress and answers the next one started at the cancel instant', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'quarry')
      clock.advanceMinutes(1)

      const response = await cancel(ana, 'sawmill', 1)

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
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'quarry')
      await enqueue(ana, 'farm')

      const response = await cancel(ana, 'quarry', 1)

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
      await enqueue(ana, 'quarry')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'sawmill')

      const response = await cancel(ana, 'sawmill', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.slot).toMatchObject({ building: 'quarry', targetLevel: 1 })
      expect(overview.queue.entries).toEqual([])
      expect(overview.buildings.sawmill.nextLevel?.level).toBe(1)
      expect(overview.resources.wood.amount).toBe(450)
      expect(overview.resources.stone.amount).toBe(475)
      const stored = await storedFiefOf(ana)
      expect(stored.ok && stored.value?.buildQueue).toEqual([])
    })

    it('answers 409 with UpgradeNotFound to an upgrade that finished before the cancel', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'quarry')
      await enqueue(ana, 'farm')
      clock.advanceMinutes(3)

      const response = await cancel(ana, 'sawmill', 1)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'UpgradeNotFound',
        message: 'Esa obra ya no está en tu cola. No queda nada que cancelar.',
      })
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(overview.buildings.sawmill.level).toBe(1)
      expect(overview.slot).toMatchObject({ building: 'quarry', targetLevel: 1 })
      expect(overview.queue.entries).toMatchObject([{ building: 'farm', targetLevel: 1 }])
    })

    it('cancels by name the upgrade that moved into the slot before the cancel', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await enqueue(ana, 'sawmill')
      await enqueue(ana, 'quarry')
      await enqueue(ana, 'farm')
      clock.advanceMinutes(3)

      const response = await cancel(ana, 'quarry', 1)

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
      await enqueueSawmill(ana)

      const responses = await Promise.all([
        cancel(ana, 'castle', 1),
        cancel(ana, 'sawmill', 0),
        cancel(ana, 'sawmill', 'uno'),
      ])

      expect(responses.map(({ status }) => status)).toEqual([400, 400, 400])
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/upgrades/sawmill/1`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })
  describe('the study route', () => {
    const study = async (lord: Lord, art: string): Promise<Response> =>
      app.request(pathOf(lord, '/studies'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
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

      const response = await study(ana, 'smithing')

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
      const stored = await storedFiefOf(ana)
      expect(stored.ok && stored.value?.studySlot.kind).toBe('busy')
    })

    it('refuses a study without a library', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql('UPDATE fiefs SET gold = 100')
      const before = await storedFiefOf(ana)

      const response = await study(ana, 'smithing')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('LibraryLevelTooLow')
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('refuses a second study while one runs', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildLibraryAt(1)
      await runSql('UPDATE fiefs SET gold = 1000')
      expect((await study(ana, 'smithing')).status).toBe(200)

      const response = await study(ana, 'masonry')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('StudySlotBusy')
    })

    it('answers the shortened duration of the next art level', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildLibraryAt(2)

      const response = await fiefOf(ana)

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

    it('answers the winter duration of the next smithing level', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildLibraryAt(2)
      const minutesToFirstWinter =
        (Date.parse('2026-10-26T00:00:00Z') - signedUpAt) / millisecondsPerMinute
      const minutesWithinTheSession = 20 * 24 * 60
      clock.advanceMinutes(minutesWithinTheSession)
      await fiefOf(ana)
      clock.advanceMinutes(minutesToFirstWinter - minutesWithinTheSession + 60)

      const response = await fiefOf(ana)

      const { arts } = FiefOverviewSchema.parse(await response.json())
      expect(arts.smithing.nextLevel?.durationSeconds).toBe(450)
    })

    it('names the resource each art raises', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await fiefOf(ana)

      const { arts } = FiefOverviewSchema.parse(await response.json())
      expect(arts.smithing.resource).toBe('iron')
      expect(arts.masonry.resource).toBe('stone')
    })

    it('answers 400 to an art the wire does not name', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await study(ana, 'alchemy')

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/studies`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ art: 'smithing' }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the recruit route', () => {
    const recruit = async (lord: Lord, body: unknown): Promise<Response> =>
      app.request(pathOf(lord, '/recruit-orders'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    const buildBarracksAt = async (level: number): Promise<void> =>
      runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, 'barracks'::building, ${level} FROM fiefs`)

    const recruitThreeInfantryAtMinuteTen = async (lord: Lord): Promise<void> => {
      await buildBarracksAt(1)
      clock.advanceMinutes(10)
      expect((await recruit(lord, { unit: 'infantry', count: 3 })).status).toBe(200)
    }

    it('places an order and answers the recruit order open', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)
      clock.advanceMinutes(10)

      const response = await recruit(ana, { unit: 'infantry', count: 3 })

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.recruitOrder).toEqual({
        unit: 'infantry',
        count: 3,
        delivered: 0,
        perUnitSeconds: 45,
        startedAt: '2026-09-22T08:10:00.000Z',
        endsAt: '2026-09-22T08:12:15.000Z',
      })
      expect(overview.units).toEqual({ infantry: 0, cavalry: 0, settler: 0 })
      expect(overview.resources.iron.amount).toBe(170)
      expect(overview.peasants.free).toBe(6)
    })

    it('answers the delivered units in the counts two periods later', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(1.5)

      const response = await fiefOf(ana)

      const { units, recruitOrder } = FiefOverviewSchema.parse(await response.json())
      expect(units).toEqual({ infantry: 2, cavalry: 0, settler: 0 })
      expect(recruitOrder?.delivered).toBe(2)
    })

    it('answers no order and the whole count after the last delivery', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(5)

      const response = await fiefOf(ana)

      const { units, recruitOrder, peasants } = FiefOverviewSchema.parse(await response.json())
      expect(units).toEqual({ infantry: 3, cavalry: 0, settler: 0 })
      expect(recruitOrder).toBeNull()
      expect(peasants.free).toBe(6)
    })

    it('records the delivered order in the chronicle', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(5)

      const response = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'recruitsDelivered',
          unit: 'infantry',
          count: 3,
          occurredAt: '2026-09-22T08:12:15.000Z',
        },
      ])
    })

    it('answers the unit duration divided by the built barracks level', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(2)

      const response = await fiefOf(ana)

      const { recruitTerms } = FiefOverviewSchema.parse(await response.json())
      expect(recruitTerms).toEqual({
        infantry: {
          cost: { wood: 20, stone: 0, iron: 10, gold: 0, food: 30 },
          peasants: 1,
          perUnitSeconds: 30,
        },
        cavalry: {
          cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
          peasants: 2,
          perUnitSeconds: 100,
        },
        settler: {
          cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
          peasants: 4,
          perUnitSeconds: 2400,
        },
      })
    })

    it('answers the spring unit duration at barracks 2', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(2)
      clock.advanceMinutes(
        (Date.parse('2026-10-07T08:00:00Z') - signedUpAt) / millisecondsPerMinute,
      )

      const response = await fiefOf(ana)

      const { recruitTerms } = FiefOverviewSchema.parse(await response.json())
      expect(recruitTerms.infantry.perUnitSeconds).toBe(23)
    })

    it('stores the spring duration on an order placed in spring', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)
      clock.advanceMinutes(
        (Date.parse('2026-10-07T08:00:00Z') - signedUpAt) / millisecondsPerMinute,
      )

      expect((await recruit(ana, { unit: 'infantry', count: 3 })).status).toBe(200)

      const stored = await storedFiefOf(ana)
      assert(stored.ok)
      expect(stored.value?.recruitOrder).toMatchObject({ kind: 'open', perUnitSeconds: 34 })
    })

    it('keeps the spring duration of an order read in summer', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)
      clock.advanceMinutes(
        (Date.parse('2026-10-11T23:59:00Z') - signedUpAt) / millisecondsPerMinute,
      )
      expect((await recruit(ana, { unit: 'infantry', count: 5 })).status).toBe(200)
      clock.advanceMinutes(2)

      const response = await fiefOf(ana)

      const { season, recruitOrder, recruitTerms } = FiefOverviewSchema.parse(await response.json())
      expect(season?.kind).toBe('summer')
      expect(recruitTerms.infantry.perUnitSeconds).toBe(45)
      expect(recruitOrder).toMatchObject({ perUnitSeconds: 34, delivered: 3 })
      expect(recruitOrder?.endsAt).toBe('2026-10-12T00:01:50.000Z')
    })

    it('refuses an order without a barracks', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const before = await storedFiefOf(ana)

      const response = await recruit(ana, { unit: 'infantry', count: 1 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'BarracksNotBuilt',
        message: 'Tu feudo aún no tiene cuartel. Levántalo primero.',
      })
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('recruits riders at barracks level 3 and counts them in the overview', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(3)
      clock.advanceMinutes(10)

      const placed = await recruit(ana, { unit: 'cavalry', count: 2 })
      clock.advanceMinutes(2.5)
      const read = await fiefOf(ana)

      expect(placed.status).toBe(200)
      expect(FiefOverviewSchema.parse(await placed.json()).recruitOrder).toEqual({
        unit: 'cavalry',
        count: 2,
        delivered: 0,
        perUnitSeconds: 75,
        startedAt: '2026-09-22T08:10:00.000Z',
        endsAt: '2026-09-22T08:12:30.000Z',
      })
      const { units, recruitOrder, recruitTerms, unitTerms, peasants } = FiefOverviewSchema.parse(
        await read.json(),
      )
      expect(units).toEqual({ infantry: 0, cavalry: 2, settler: 0 })
      expect(recruitOrder).toBeNull()
      expect(peasants.free).toBe(3)
      expect(recruitTerms.cavalry).toEqual({
        cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
        peasants: 2,
        perUnitSeconds: 75,
      })
      expect(unitTerms.cavalry).toEqual({
        strength: 2,
        carry: 120,
        roadPercent: 50,
        barracksLevel: 3,
      })
    })

    it('refuses riders below barracks level 3', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(2)
      const before = await storedFiefOf(ana)

      const response = await recruit(ana, { unit: 'cavalry', count: 1 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'BarracksTooLow',
        message: 'Tu cuartel aún no llega al nivel 3 que piden los jinetes. Mejóralo primero.',
      })
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('recruits a settler at barracks level 5 and counts it in the overview', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(5)
      await runSql(
        `INSERT INTO fief_buildings (fief_id, building, level) SELECT id, 'farm'::building, 8 FROM fiefs`,
      )
      await runSql(
        'UPDATE fiefs SET wood = 1000, stone = 1000, iron = 600, gold = 100, food = 1000',
      )
      clock.advanceMinutes(10)

      const placed = await recruit(ana, { unit: 'settler', count: 1 })
      clock.advanceMinutes(20)
      const read = await fiefOf(ana)

      expect(placed.status).toBe(200)
      expect(FiefOverviewSchema.parse(await placed.json()).recruitOrder).toEqual({
        unit: 'settler',
        count: 1,
        delivered: 0,
        perUnitSeconds: 1200,
        startedAt: '2026-09-22T08:10:00.000Z',
        endsAt: '2026-09-22T08:30:00.000Z',
      })
      const { units, recruitOrder, recruitTerms, unitTerms } = FiefOverviewSchema.parse(
        await read.json(),
      )
      expect(units).toEqual({ infantry: 0, cavalry: 0, settler: 1 })
      expect(recruitOrder).toBeNull()
      expect(recruitTerms.settler).toEqual({
        cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
        peasants: 4,
        perUnitSeconds: 1200,
      })
      expect(unitTerms.settler).toEqual({
        strength: 0,
        carry: 0,
        roadPercent: 100,
        barracksLevel: 5,
      })
    })

    it('refuses settlers below barracks level 5', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(4)
      const before = await storedFiefOf(ana)

      const response = await recruit(ana, { unit: 'settler', count: 1 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'BarracksTooLow',
        message: 'Tu cuartel aún no llega al nivel 5 que piden los colonos. Mejóralo primero.',
      })
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('refuses a second order while one is open', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await recruitThreeInfantryAtMinuteTen(ana)

      const response = await recruit(ana, { unit: 'infantry', count: 1 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'RecruitSlotBusy',
        message: 'El cuartel ya tiene una leva en marcha. Espera a que termine.',
      })
    })

    it('refuses an order the free peasants cannot staff', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)

      const response = await recruit(ana, { unit: 'infantry', count: 10 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('NotEnoughPeasants')
    })

    it('refuses an order the busy upgrade would leave unstaffed and keeps the fief readable', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)
      expect((await enqueue(ana, 'sawmill')).status).toBe(200)
      expect((await enqueue(ana, 'farm')).status).toBe(200)

      const refused = await recruit(ana, { unit: 'infantry', count: 9 })
      clock.advanceMinutes(2)
      const read = await fiefOf(ana)

      expect(refused.status).toBe(409)
      expect(ApiErrorSchema.parse(await refused.json()).kind).toBe('NotEnoughPeasants')
      expect(read.status).toBe(200)
    })

    it('refuses an order the stocks cannot pay', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)
      await runSql('UPDATE fiefs SET food = 0')

      const response = await recruit(ana, { unit: 'infantry', count: 1 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InsufficientResources')
    })

    it('answers 400 to a fractional count', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await buildBarracksAt(1)

      const response = await recruit(ana, { unit: 'infantry', count: 1.5 })

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/recruit-orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ unit: 'infantry', count: 1 }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the recruit cancel route', () => {
    const cancelRecruit = async (lord: Lord, unit: string, startedAt: string): Promise<Response> =>
      app.request(`/fiefs/${lord.fiefId}/recruit-orders/${unit}/${encodeURIComponent(startedAt)}`, {
        method: 'DELETE',
        headers: { cookie: lord.cookie },
      })

    const recruitThreeInfantryAtMinuteTen = async (lord: Lord): Promise<string> => {
      await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, 'barracks'::building, 1 FROM fiefs`)
      clock.advanceMinutes(10)
      const placed = await app.request(pathOf(lord, '/recruit-orders'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ unit: 'infantry', count: 3 }),
      })
      expect(placed.status).toBe(200)
      const { recruitOrder } = FiefOverviewSchema.parse(await placed.json())
      return recruitOrder?.startedAt ?? ''
    }

    const recruitOrderNotFound = {
      kind: 'RecruitOrderNotFound',
      message: 'El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.',
    }

    it('cancels the order and answers the delivered units in the counts', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const startedAt = await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(1.5)

      const response = await cancelRecruit(ana, 'infantry', startedAt)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.recruitOrder).toBeNull()
      expect(overview.units).toEqual({ infantry: 2, cavalry: 0, settler: 0 })
      expect(overview.readAt).toBe('2026-09-22T08:11:30.000Z')
    })

    it('answers the undelivered units refunded and their peasants free', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const startedAt = await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(1)

      const response = await cancelRecruit(ana, 'infantry', startedAt)

      const { resources, peasants, units } = FiefOverviewSchema.parse(await response.json())
      expect(units).toEqual({ infantry: 1, cavalry: 0, settler: 0 })
      expect(resources.iron.amount).toBe(190)
      expect(peasants.free).toBe(8)
    })

    it('records the cancel in the chronicle with its refund', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const startedAt = await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(1)
      expect((await cancelRecruit(ana, 'infantry', startedAt)).status).toBe(200)

      const response = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'recruitsCancelled',
          unit: 'infantry',
          delivered: 1,
          cancelled: 2,
          occurredAt: '2026-09-22T08:11:00.000Z',
          refund: { wood: 40, stone: 0, iron: 20, gold: 0, food: 60 },
        },
      ])
    })

    it('refuses to cancel an order that ended before the cancel', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const startedAt = await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(5)

      const response = await cancelRecruit(ana, 'infantry', startedAt)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual(recruitOrderNotFound)
    })

    it('shows the ended order delivered on the read after a refused cancel', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      const startedAt = await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(5)
      expect((await cancelRecruit(ana, 'infantry', startedAt)).status).toBe(409)

      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect(overview.units).toEqual({ infantry: 3, cavalry: 0, settler: 0 })
      expect(overview.recruitOrder).toBeNull()
      const chronicle = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })
      expect(FiefChronicleSchema.parse(await chronicle.json()).events).toEqual([
        {
          kind: 'recruitsDelivered',
          unit: 'infantry',
          count: 3,
          occurredAt: '2026-09-22T08:12:15.000Z',
        },
      ])
    })

    it('refuses a cancel that names another start', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await recruitThreeInfantryAtMinuteTen(ana)
      clock.advanceMinutes(1)

      const response = await cancelRecruit(ana, 'infantry', '2026-09-22T08:09:00.000Z')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual(recruitOrderNotFound)
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(overview.recruitOrder?.startedAt).toBe('2026-09-22T08:10:00.000Z')
      expect(overview.units).toEqual({ infantry: 1, cavalry: 0, settler: 0 })
    })

    it('answers 400 for a malformed start', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await cancelRecruit(ana, 'infantry', 'ayer')

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(
        `/fiefs/${unknownFiefId}/recruit-orders/infantry/${encodeURIComponent('2026-09-22T08:10:00.000Z')}`,
        { method: 'DELETE' },
      )

      expect(response.status).toBe(401)
    })
  })

  describe('the study cancel route', () => {
    const cancelStudy = async (
      lord: Lord,
      art: string,
      targetLevel: string | number,
    ): Promise<Response> =>
      app.request(`/fiefs/${lord.fiefId}/studies/${art}/${targetLevel}`, {
        method: 'DELETE',
        headers: { cookie: lord.cookie },
      })

    const studySmithingAtMinuteTen = async (lord: Lord): Promise<void> => {
      await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, 'library'::building, 1 FROM fiefs`)
      await runSql('UPDATE fiefs SET gold = 100')
      clock.advanceMinutes(10)
      const started = await app.request(pathOf(lord, '/studies'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ art: 'smithing' }),
      })
      expect(started.status).toBe(200)
    }

    it('cancels the study and answers the fief with the study slot idle', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await studySmithingAtMinuteTen(ana)
      clock.advanceMinutes(1)

      const response = await cancelStudy(ana, 'smithing', 1)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.study).toEqual({ kind: 'idle' })
      expect(overview.arts.smithing.level).toBe(0)
      expect(overview.resources.gold.amount).toBe(100)
      expect(overview.readAt).toBe('2026-09-22T08:11:00.000Z')
      const stored = await storedFiefOf(ana)
      expect(stored.ok && stored.value?.studySlot).toEqual({ kind: 'idle' })
      expect(stored.ok && stored.value?.stocks.gold).toBe(100)
    })

    it('applies a study that finished before the cancel and refuses with StudyNotFound', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await studySmithingAtMinuteTen(ana)
      await runSql(`UPDATE fiefs SET study_finishes_at = '2026-09-22T08:12:00Z'`)
      clock.advanceMinutes(3)

      const response = await cancelStudy(ana, 'smithing', 1)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'StudyNotFound',
        message: 'La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.',
      })
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(overview.arts.smithing.level).toBe(1)
      expect(overview.study).toEqual({ kind: 'idle' })
    })

    it('answers 400 to a target level that is not a whole count from one', async () => {
      const ana = await signUp('ana@example.com', 'Valdehierro')

      const response = await cancelStudy(ana, 'smithing', 0)

      expect(response.status).toBe(400)
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/studies/smithing/1`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the march route', () => {
    const march = async (lord: Lord, body: unknown): Promise<Response> =>
      app.request(pathOf(lord, '/marches'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    const fiveInfantryToProvinceTwoPlotFive = {
      province: 2,
      plot: 5,
      units: { infantry: 5, cavalry: 0, settler: 0 },
      stayHours: 2,
    }

    const signUpWithFiveInfantry = async (): Promise<SignedUpPlayer> => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'infantry'::unit, 5 FROM fiefs`)
      return ana
    }

    const refusalOf = async (response: Response): Promise<unknown> =>
      ApiErrorSchema.parse(await response.json())

    it('answers no march and the shipped forage terms on a new fief', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await fiefOf(ana)

      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.march).toBeNull()
      expect(overview.forageTerms).toEqual({
        secondsPerProvince: 600,
        secondsPerPlot: 60,
        maxStayHours: 8,
        yieldPerHour: {
          lowlands: { wood: 3, stone: 0, iron: 0, gold: 0, food: 3 },
          uplands: { wood: 3, stone: 3, iron: 0, gold: 0, food: 0 },
          ridges: { wood: 0, stone: 3, iron: 3, gold: 0, food: 0 },
        },
      })
    })

    it('answers the shipped combat terms', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await fiefOf(ana)

      expect(FiefOverviewSchema.parse(await response.json()).combatTerms).toEqual({
        lootPerStrength: 60,
        tiers: {
          1: { maxStrength: 6, regrowHours: 6 },
          2: { maxStrength: 15, regrowHours: 12 },
          3: { maxStrength: 40, regrowHours: 24 },
        },
      })
    })

    it('answers the shipped unit terms', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await fiefOf(ana)

      expect(FiefOverviewSchema.parse(await response.json()).unitTerms).toEqual({
        infantry: { strength: 1, carry: 48, roadPercent: 100, barracksLevel: 1 },
        cavalry: { strength: 2, carry: 120, roadPercent: 50, barracksLevel: 3 },
        settler: { strength: 0, carry: 0, roadPercent: 100, barracksLevel: 5 },
      })
    })

    it('sends a march and answers it outbound with its instants', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await march(ana, fiveInfantryToProvinceTwoPlotFive)

      expect(response.status).toBe(200)
      expect(FiefOverviewSchema.parse(await response.json()).march).toEqual({
        province: 2,
        plot: 5,
        terrain: 'uplands',
        units: { infantry: 5, cavalry: 0, settler: 0 },
        stayHours: 2,
        departedAt: '2026-09-22T08:00:00.000Z',
        oneWaySeconds: 840,
        loot: { wood: 30, stone: 30, iron: 0, gold: 0, food: 0 },
        arrivesAt: '2026-09-22T08:14:00.000Z',
        leavesAt: '2026-09-22T10:14:00.000Z',
        returnsAt: '2026-09-22T10:28:00.000Z',
        recalledAt: null,
        order: 'forage',
        camp: null,
        fought: false,
      })
    })

    it('answers the infantry away still counted', async () => {
      const ana = await signUpWithFiveInfantry()
      await march(ana, fiveInfantryToProvinceTwoPlotFive)
      clock.advanceMinutes(60)

      const response = await fiefOf(ana)

      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.units).toEqual({ infantry: 5, cavalry: 0, settler: 0 })
      expect(overview.march?.units).toEqual({ infantry: 5, cavalry: 0, settler: 0 })
    })

    it('adds the loot and idles the march slot at the return', async () => {
      const ana = await signUpWithFiveInfantry()
      await runSql('UPDATE fiefs SET wood = 1000, stone = 1000')
      await march(ana, fiveInfantryToProvinceTwoPlotFive)
      clock.advanceMinutes(148)

      const response = await fiefOf(ana)

      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.march).toBeNull()
      expect(overview.resources.wood.amount).toBe(1030)
      expect(overview.resources.stone.amount).toBe(1030)
      expect(overview.units).toEqual({ infantry: 5, cavalry: 0, settler: 0 })
    })

    it('records the returned march in the chronicle', async () => {
      const ana = await signUpWithFiveInfantry()
      await march(ana, fiveInfantryToProvinceTwoPlotFive)
      clock.advanceMinutes(148)

      const response = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'marchReturned',
          province: 2,
          plot: 5,
          units: { infantry: 5, cavalry: 0, settler: 0 },
          loot: { wood: 30, stone: 30, iron: 0, gold: 0, food: 0 },
          occurredAt: '2026-09-22T10:28:00.000Z',
          recalled: false,
        },
      ])
    })

    it('records a recalled march in the chronicle as recalled', async () => {
      const ana = await signUpWithFiveInfantry()
      await march(ana, fiveInfantryToProvinceTwoPlotFive)
      await runSql(
        `UPDATE fief_marches SET recalled_at = '2026-09-22T08:44:00Z', loot_wood = 7, loot_stone = 7`,
      )
      clock.advanceMinutes(58)

      const response = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'marchReturned',
          province: 2,
          plot: 5,
          units: { infantry: 5, cavalry: 0, settler: 0 },
          loot: { wood: 7, stone: 7, iron: 0, gold: 0, food: 0 },
          occurredAt: '2026-09-22T08:58:00.000Z',
          recalled: true,
        },
      ])
    })

    it('refuses a march to a held plot', async () => {
      const ana = await signUpWithFiveInfantry()
      await signUp('bea@example.com', 'Vado Gris')

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        province: 1,
        plot: 2,
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'PlotHeld',
        message: 'Esa parcela ya tiene feudo. Elige una libre.',
      })
    })

    it('refuses a forage march to a camp plot', async () => {
      const ana = await signUpWithFiveInfantry()

      const { camps } = server.buildingCatalog.fiefSettings()
      const campPlot = Array.from({ length: 15 }, (_, index) => index + 1).find(
        (plot) => campOf({ kingdom: 1, province: 2, plot }, camps) !== undefined,
      )

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        plot: campPlot,
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'PlotHasCamp',
        message: 'Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.',
      })
    })

    it('refuses a march to the fief own plot', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        province: 1,
        plot: 1,
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'MarchToOwnPlot',
        message:
          'A un feudo tuyo solo puedes enviar un transporte, y nunca al mismo del que sale. Elige otro destino.',
      })
    })

    it('refuses more infantry than are at home', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        units: { infantry: 6, cavalry: 0, settler: 0 },
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughUnitsAtHome',
        message: 'Necesitas 6 infantes en casa y tienes 5. Ajusta la marcha.',
      })
    })

    it('refuses a second march while one is away', async () => {
      const ana = await signUpWithFiveInfantry()
      await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        units: { infantry: 2, cavalry: 0, settler: 0 },
      })

      const response = await march(ana, {
        province: 1,
        plot: 3,
        units: { infantry: 3, cavalry: 0, settler: 0 },
        stayHours: 1,
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'MarchSlotBusy',
        message: 'El cuartel ya tiene una marcha en curso. Espera a que vuelva.',
      })
      const { march: stored } = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(stored).toMatchObject({
        province: 2,
        plot: 5,
        units: { infantry: 2, cavalry: 0, settler: 0 },
        stayHours: 2,
      })
    })

    it('refuses a stay of nine hours', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        stayHours: 9,
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'StayOutOfRange',
        message: 'Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.',
      })
    })

    it('refuses a province past the map bound', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        province: 3,
      })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'MarchTargetOutOfBounds',
        message: 'Esa parcela no está en el mapa. Elige una que lo esté.',
      })
    })

    it('answers 400 with an empty body to a fractional stay', async () => {
      const ana = await signUpWithFiveInfantry()

      const response = await march(ana, {
        ...fiveInfantryToProvinceTwoPlotFive,
        stayHours: 1.5,
      })

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('')
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(overview.march).toBeNull()
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/marches`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(fiveInfantryToProvinceTwoPlotFive),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('the march recall route', () => {
    const recall = async (lord: Lord, departedAt: string): Promise<Response> =>
      app.request(`/fiefs/${lord.fiefId}/marches/${encodeURIComponent(departedAt)}/recall`, {
        method: 'POST',
        headers: { cookie: lord.cookie },
      })

    const departedAt = '2026-09-22T08:00:00.000Z'

    const sendFiveInfantryToProvinceTwoPlotFive = async (): Promise<SignedUpPlayer> => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'infantry'::unit, 5 FROM fiefs`)
      const sent = await app.request(pathOf(ana, '/marches'), {
        method: 'POST',
        headers: { cookie: ana.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({
          province: 2,
          plot: 5,
          units: { infantry: 5, cavalry: 0, settler: 0 },
          stayHours: 2,
        }),
      })
      expect(sent.status).toBe(200)
      return ana
    }

    const marchNotFound = {
      kind: 'MarchNotFound',
      message: 'El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.',
    }

    it('recalls a march on the way out and answers it returning', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()
      clock.advanceMinutes(10)

      const response = await recall(ana, departedAt)

      expect(response.status).toBe(200)
      expect(FiefOverviewSchema.parse(await response.json()).march).toEqual({
        province: 2,
        plot: 5,
        terrain: 'uplands',
        units: { infantry: 5, cavalry: 0, settler: 0 },
        stayHours: 2,
        departedAt,
        oneWaySeconds: 840,
        loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
        arrivesAt: '2026-09-22T08:10:00.000Z',
        leavesAt: '2026-09-22T08:10:00.000Z',
        returnsAt: '2026-09-22T08:20:00.000Z',
        recalledAt: '2026-09-22T08:10:00.000Z',
        order: 'forage',
        camp: null,
        fought: false,
      })
    })

    it('recalls a foraging march with the loot of the seconds foraged', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()
      clock.advanceMinutes(44)

      const response = await recall(ana, departedAt)

      expect(response.status).toBe(200)
      expect(FiefOverviewSchema.parse(await response.json()).march).toMatchObject({
        loot: { wood: 7, stone: 7, iron: 0, gold: 0, food: 0 },
        arrivesAt: '2026-09-22T08:14:00.000Z',
        leavesAt: '2026-09-22T08:44:00.000Z',
        returnsAt: '2026-09-22T08:58:00.000Z',
        recalledAt: '2026-09-22T08:44:00.000Z',
      })
    })

    it('brings the recalled loot home on the read after the return', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()
      await runSql('UPDATE fiefs SET wood = 1000, stone = 1000')
      clock.advanceMinutes(44)
      expect((await recall(ana, departedAt)).status).toBe(200)
      clock.advanceMinutes(14)

      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect(overview.march).toBeNull()
      expect(overview.resources.wood.amount).toBe(1007)
      expect(overview.resources.stone.amount).toBe(1007)
      expect(overview.units).toEqual({ infantry: 5, cavalry: 0, settler: 0 })
    })

    it('refuses a recall once the march is returning', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()
      clock.advanceMinutes(140)

      const response = await recall(ana, departedAt)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'MarchAlreadyReturning',
        message: 'Esa marcha ya viene de vuelta. Espera a que llegue.',
      })
      const { march } = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(march).toMatchObject({ recalledAt: null, returnsAt: '2026-09-22T10:28:00.000Z' })
    })

    it('refuses a recall that names another departure', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()
      clock.advanceMinutes(10)

      const response = await recall(ana, '2026-09-22T07:59:00.000Z')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual(marchNotFound)
      const { march } = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(march).toMatchObject({ departedAt, recalledAt: null })
    })

    it('refuses a recall after the march came home', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()
      clock.advanceMinutes(148)

      const response = await recall(ana, departedAt)

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual(marchNotFound)
      const { march } = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(march).toBeNull()
    })

    it('answers 400 for a malformed departure', async () => {
      const ana = await sendFiveInfantryToProvinceTwoPlotFive()

      const response = await recall(ana, 'ayer')

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('')
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(
        `/fiefs/${unknownFiefId}/marches/${encodeURIComponent(departedAt)}/recall`,
        {
          method: 'POST',
        },
      )

      expect(response.status).toBe(401)
    })
  })
  describe('the attack route', () => {
    const attack = async (lord: Lord, body: unknown): Promise<Response> =>
      app.request(pathOf(lord, '/marches/attack'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    const signUpWithTenInfantry = async (): Promise<SignedUpPlayer> => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'infantry'::unit, 10 FROM fiefs`)
      return ana
    }

    const attackedMarchOf = async (response: Response): Promise<AttackedMarch> => {
      expect(response.status).toBe(200)
      const { march } = FiefOverviewSchema.parse(await response.json())
      assert(march?.order === 'attack')
      return march
    }

    const minutesOf = (seconds: number): number => seconds / 60

    const sendTenInfantryToTierOneCamp = async (): Promise<SentAttack> => {
      const lord = await signUpWithTenInfantry()
      const sent = await attackedMarchOf(
        await attack(lord, {
          province: 2,
          plot: campPlotOfTier(1),
          units: { infantry: 10, cavalry: 0, settler: 0 },
        }),
      )
      return { lord, sent }
    }

    it('sends an attack and answers it outbound with the camp snapshot', async () => {
      const plot = campPlotOfTier(1)
      const ana = await signUpWithTenInfantry()

      const sent = await attackedMarchOf(
        await attack(ana, { province: 2, plot, units: { infantry: 10, cavalry: 0, settler: 0 } }),
      )

      expect(sent).toMatchObject({
        order: 'attack',
        province: 2,
        plot,
        terrain: 'uplands',
        units: { infantry: 10, cavalry: 0, settler: 0 },
        stayHours: 0,
        departedAt: '2026-09-22T08:00:00.000Z',
        loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
        camp: { tier: 1, strength: 6 },
        fought: false,
        recalledAt: null,
      })
      expect(sent.leavesAt).toBe(sent.arrivesAt)
      expect(Date.parse(sent.returnsAt) - Date.parse(sent.departedAt)).toBe(
        2 * sent.oneWaySeconds * 1000,
      )
    })

    it('fights at the arrival and answers fewer infantry', async () => {
      const { lord, sent } = await sendTenInfantryToTierOneCamp()
      clock.advanceMinutes(minutesOf(sent.oneWaySeconds))

      const overview = FiefOverviewSchema.parse(await (await fiefOf(lord)).json())

      expect(overview.march).toMatchObject({
        order: 'attack',
        units: { infantry: 6, cavalry: 0, settler: 0 },
        fought: true,
      })
      expect(overview.units).toEqual({ infantry: 6, cavalry: 0, settler: 0 })
    })

    it('brings the loot home at the return', async () => {
      const ana = await signUpWithTenInfantry()
      await runSql('UPDATE fiefs SET wood = 1000, stone = 1000, gold = 1000')
      const sent = await attackedMarchOf(
        await attack(ana, {
          province: 2,
          plot: campPlotOfTier(1),
          units: { infantry: 10, cavalry: 0, settler: 0 },
        }),
      )
      clock.advanceMinutes(2 * minutesOf(sent.oneWaySeconds))

      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect(overview.march).toBeNull()
      expect(overview.resources.wood.amount).toBe(1096)
      expect(overview.resources.stone.amount).toBe(1096)
      expect(overview.resources.gold.amount).toBe(1096)
      expect(overview.units).toEqual({ infantry: 6, cavalry: 0, settler: 0 })
    })

    it('records the battle and the return in the chronicle', async () => {
      const { lord, sent } = await sendTenInfantryToTierOneCamp()
      clock.advanceMinutes(2 * minutesOf(sent.oneWaySeconds))

      const response = await app.request(pathOf(lord, '/events'), {
        headers: { cookie: lord.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'marchReturned',
          province: 2,
          plot: sent.plot,
          units: { infantry: 6, cavalry: 0, settler: 0 },
          loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
          occurredAt: sent.returnsAt,
          recalled: false,
        },
        {
          kind: 'battleFought',
          province: 2,
          plot: sent.plot,
          tier: 1,
          won: true,
          unitsLost: { infantry: 4, cavalry: 0, settler: 0 },
          campLost: 6,
          occurredAt: sent.arrivesAt,
        },
      ])
    })

    it('loses every man sent against a stronger camp', async () => {
      const ana = await signUpWithTenInfantry()
      const sent = await attackedMarchOf(
        await attack(ana, {
          province: 2,
          plot: campPlotOfTier(2),
          units: { infantry: 10, cavalry: 0, settler: 0 },
        }),
      )
      clock.advanceMinutes(minutesOf(sent.oneWaySeconds))

      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect(sent.camp).toEqual({ tier: 2, strength: 15 })
      expect(overview.march).toBeNull()
      expect(overview.units).toEqual({ infantry: 0, cavalry: 0, settler: 0 })
    })

    it('fights the camp the lord beat on the read that sends again', async () => {
      const { lord, sent } = await sendTenInfantryToTierOneCamp()
      clock.advanceMinutes(minutesOf(sent.oneWaySeconds) + 60)

      const again = await attackedMarchOf(
        await attack(lord, {
          province: 2,
          plot: sent.plot,
          units: { infantry: 6, cavalry: 0, settler: 0 },
        }),
      )

      expect(again.camp).toEqual({ tier: 1, strength: 1 })
    })

    it('shows the beaten camp on the map', async () => {
      const { lord, sent } = await sendTenInfantryToTierOneCamp()
      clock.advanceMinutes(minutesOf(sent.oneWaySeconds))
      expect((await fiefOf(lord)).status).toBe(200)

      const response = await app.request(pathOf(lord, '/map/2'), {
        headers: { cookie: lord.cookie },
      })

      const { plots } = ProvinceMapSchema.parse(await response.json())
      expect(plots.find(({ plot }) => plot === sent.plot)?.camp).toEqual({
        tier: 1,
        strength: 0,
      })
    })

    it('refuses an attack on a plot without a camp', async () => {
      const ana = await signUpWithTenInfantry()
      const plot = provinceTwoPlotWhere((tier) => tier === undefined)

      const response = await attack(ana, {
        province: 2,
        plot,
        units: { infantry: 10, cavalry: 0, settler: 0 },
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'PlotHasNoCamp',
        message: 'Esa parcela no tiene campamento de bandidos. Elige una que lo tenga.',
      })
    })

    it('refuses a recall at the battle', async () => {
      const { lord, sent } = await sendTenInfantryToTierOneCamp()
      clock.advanceMinutes(minutesOf(sent.oneWaySeconds))

      const response = await app.request(
        `/fiefs/${lord.fiefId}/marches/${encodeURIComponent(sent.departedAt)}/recall`,
        { method: 'POST', headers: { cookie: lord.cookie } },
      )

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('MarchAlreadyReturning')
    })

    it('answers 400 with an empty body to an attack with no unit', async () => {
      const ana = await signUpWithTenInfantry()

      const response = await attack(ana, {
        province: 2,
        plot: campPlotOfTier(1),
        units: { infantry: 0, cavalry: 0, settler: 0 },
      })

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('')
    })

    it('answers 401 without a session', async () => {
      const response = await app.request(`/fiefs/${unknownFiefId}/marches/attack`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          province: 2,
          plot: campPlotOfTier(1),
          units: { infantry: 10, cavalry: 0, settler: 0 },
        }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('a party of infantry and riders', () => {
    const post = async (lord: Lord, path: string, body: unknown): Promise<Response> =>
      app.request(pathOf(lord, path), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    const signUpAtBarracksThreeWithTwelveInfantryAndSixRiders =
      async (): Promise<SignedUpPlayer> => {
        const ana = await signUp('ana@example.com', 'Valdehierro')
        await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
          SELECT id, 'barracks'::building, 3 FROM fiefs
          UNION ALL SELECT id, 'farm'::building, 8 FROM fiefs
          ON CONFLICT (fief_id, building) DO UPDATE SET level = excluded.level`)
        await runSql(`INSERT INTO fief_units (fief_id, kind, count)
          SELECT id, 'infantry'::unit, 12 FROM fiefs
          UNION ALL SELECT id, 'cavalry'::unit, 6 FROM fiefs`)
        return ana
      }

    const awayMarchOf = async (response: Response): Promise<NonNullable<FiefOverview['march']>> => {
      expect(response.status).toBe(200)
      const { march } = FiefOverviewSchema.parse(await response.json())
      assert(march !== null)
      return march
    }

    const attackFiveAndFiveOnTierOneCamp = async (lord: Lord): Promise<AttackedMarch> => {
      const sent = await awayMarchOf(
        await post(lord, '/marches/attack', {
          province: 2,
          plot: campPlotOfTier(1),
          units: { infantry: 5, cavalry: 5, settler: 0 },
        }),
      )
      assert(sent.order === 'attack')
      return sent
    }

    it('sends infantry and riders and answers the party outbound', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()

      const sent = await awayMarchOf(
        await post(ana, '/marches', {
          province: 2,
          plot: 5,
          units: { infantry: 12, cavalry: 6, settler: 0 },
          stayHours: 2,
        }),
      )

      expect(sent).toMatchObject({
        order: 'forage',
        province: 2,
        plot: 5,
        units: { infantry: 12, cavalry: 6, settler: 0 },
        oneWaySeconds: 840,
        loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
      })
    })

    it('refuses a forage march carrying a settler', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()
      await runSql(
        `INSERT INTO fief_units (fief_id, kind, count) SELECT id, 'settler'::unit, 1 FROM fiefs`,
      )
      const before = await storedFiefOf(ana)

      const response = await post(ana, '/marches', {
        province: 2,
        plot: 5,
        units: { infantry: 12, cavalry: 0, settler: 1 },
        stayHours: 2,
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'UnitUnfitForOrder',
        message: 'Un colono no forrajea, no ataca ni lleva carga. Envíalo a fundar un feudo.',
      })
      expect(await storedFiefOf(ana)).toEqual(before)
    })

    it('times a march of riders alone at half the road', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()

      const sent = await awayMarchOf(
        await post(ana, '/marches', {
          province: 2,
          plot: 5,
          units: { infantry: 0, cavalry: 6, settler: 0 },
          stayHours: 2,
        }),
      )

      expect(sent.units).toEqual({ infantry: 0, cavalry: 6, settler: 0 })
      expect(sent.oneWaySeconds).toBe(420)
    })

    it('fights with both kinds and answers the survivors per kind', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()
      const sent = await attackFiveAndFiveOnTierOneCamp(ana)
      clock.advanceMinutes(sent.oneWaySeconds / 60)

      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect(overview.march).toMatchObject({
        fought: true,
        units: { infantry: 2, cavalry: 5, settler: 0 },
      })
      expect(overview.units).toEqual({ infantry: 9, cavalry: 6, settler: 0 })
    })

    it('records each kind in the chronicle', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()
      const sent = await attackFiveAndFiveOnTierOneCamp(ana)
      clock.advanceMinutes((2 * sent.oneWaySeconds) / 60)

      const response = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'marchReturned',
          province: 2,
          plot: sent.plot,
          units: { infantry: 2, cavalry: 5, settler: 0 },
          loot: { wood: 120, stone: 120, iron: 0, gold: 120, food: 0 },
          occurredAt: sent.returnsAt,
          recalled: false,
        },
        {
          kind: 'battleFought',
          province: 2,
          plot: sent.plot,
          tier: 1,
          won: true,
          unitsLost: { infantry: 3, cavalry: 0, settler: 0 },
          campLost: 6,
          occurredAt: sent.arrivesAt,
        },
      ])
    })

    it('refuses more riders than are at home', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()

      const response = await post(ana, '/marches', {
        province: 2,
        plot: 5,
        units: { infantry: 12, cavalry: 7, settler: 0 },
        stayHours: 2,
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'NotEnoughUnitsAtHome',
        message: 'Necesitas 7 jinetes en casa y tienes 6. Ajusta la marcha.',
      })
    })

    it('names one rider short in the singular', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()
      await runSql(`UPDATE fief_units SET count = 0 WHERE kind = 'cavalry'`)

      const response = await post(ana, '/marches', {
        province: 2,
        plot: 5,
        units: { infantry: 0, cavalry: 1, settler: 0 },
        stayHours: 2,
      })

      expect(ApiErrorSchema.parse(await response.json()).message).toBe(
        'Necesitas 1 jinete en casa y tienes 0. Ajusta la marcha.',
      )
    })

    it('answers 400 for a march with no unit', async () => {
      const ana = await signUpAtBarracksThreeWithTwelveInfantryAndSixRiders()

      const response = await post(ana, '/marches', {
        province: 2,
        plot: 5,
        units: { infantry: 0, cavalry: 0, settler: 0 },
        stayHours: 2,
      })

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('')
      const overview = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      expect(overview.march).toBeNull()
    })
  })

  describe('the battle at the arrival', () => {
    type CampBattleRow = {
      readonly province: number
      readonly plot: number
      readonly strength: number
      readonly foughtAt: string
    }

    const campBattleRows = async (): Promise<ReadonlyArray<CampBattleRow>> => {
      const client = new Client({ connectionString: databaseUrl() })
      await client.connect()
      try {
        const read = await client.query<CampBattleRow>(
          `SELECT province, plot, strength,
             to_char(fought_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "foughtAt"
           FROM camp_battles ORDER BY id`,
        )
        return read.rows
      } finally {
        await client.end()
      }
    }

    const signUpAttackingTierOneCamp = async (plot: number): Promise<SignedUpPlayer> => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'infantry'::unit, 10 FROM fiefs`)
      await runSql(
        `INSERT INTO fief_marches (fief_id, march_order, province, plot, infantry_count,
           cavalry_count, settler_count, stay_hours, one_way_seconds, departed_at, loot_wood, loot_stone,
           loot_iron, loot_gold, loot_food, loot_percent_wood, loot_percent_stone, loot_percent_iron,
           loot_percent_gold, loot_percent_food, camp_tier, camp_strength, fought)
         SELECT id, 'attack', 2, ${plot}, 10, 0, 0, 0, 600, '2026-09-22T08:00:00Z', 96, 96, 0, 96, 0,
           100, 100, 100, 100, 100, 1, 6, false
         FROM fiefs`,
      )
      return ana
    }

    it('stores the camp beaten to 0 with the fief that fought it', async () => {
      const plot = campPlotOfTier(1)
      const ana = await signUpAttackingTierOneCamp(plot)
      clock.advanceMinutes(21)

      const response = await fiefOf(ana)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.march).toBeNull()
      expect(overview.units).toEqual({ infantry: 6, cavalry: 0, settler: 0 })
      expect(await campBattleRows()).toEqual([
        { province: 2, plot, strength: 0, foughtAt: '2026-09-22T08:10:00Z' },
      ])
    })

    it('answers the battle and the return of a won attack in the chronicle', async () => {
      const plot = campPlotOfTier(1)
      const ana = await signUpAttackingTierOneCamp(plot)
      clock.advanceMinutes(21)

      const response = await app.request(pathOf(ana, '/events'), {
        headers: { cookie: ana.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events).toEqual([
        {
          kind: 'marchReturned',
          province: 2,
          plot,
          units: { infantry: 6, cavalry: 0, settler: 0 },
          loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
          occurredAt: '2026-09-22T08:20:00.000Z',
          recalled: false,
        },
        {
          kind: 'battleFought',
          province: 2,
          plot,
          tier: 1,
          won: true,
          unitsLost: { infantry: 4, cavalry: 0, settler: 0 },
          campLost: 6,
          occurredAt: '2026-09-22T08:10:00.000Z',
        },
      ])
    })

    it('stores no camp battle when the mutation after the resolve is refused', async () => {
      const ana = await signUpAttackingTierOneCamp(campPlotOfTier(1))
      await runSql('UPDATE fiefs SET wood = 0')
      clock.advanceMinutes(11)

      const response = await enqueue(ana, 'sawmill')

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json()).kind).toBe('InsufficientResources')
      expect(await campBattleRows()).toEqual([])
      const stored = await storedFiefOf(ana)
      assert(stored.ok)
      expect(stored.value?.march).toMatchObject({
        fought: false,
        units: { infantry: 10, cavalry: 0, settler: 0 },
      })
    })
  })

  describe('the founding route', () => {
    const found = async (lord: Lord, body: unknown): Promise<Response> =>
      app.request(pathOf(lord, '/marches/found'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    const signUpWithASettler = async (email: string, fiefName: string): Promise<SignedUpPlayer> => {
      const lord = await signUp(email, fiefName)
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'settler'::unit, 1 FROM fiefs WHERE name = '${fiefName}'`)
      return lord
    }

    const freePlot = (): number => provinceTwoPlotWhere((tier) => tier === undefined)

    const foundingOnFreePlot = () => ({
      province: 2,
      plot: freePlot(),
      name: 'Sotoverde del Páramo',
    })

    it('sends a founding march and answers it outbound', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')

      const response = await found(ana, foundingOnFreePlot())

      expect(response.status).toBe(200)
      const { march, units } = FiefOverviewSchema.parse(await response.json())
      expect(march).toMatchObject({
        order: 'found',
        name: 'Sotoverde del Páramo',
        province: 2,
        plot: freePlot(),
        units: { infantry: 0, cavalry: 0, settler: 1 },
        stayHours: 0,
        departedAt: '2026-09-22T08:00:00.000Z',
        oneWaySeconds: 600 + (freePlot() - 1) * 60,
        loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
        recalledAt: null,
        camp: null,
        fought: false,
      })
      expect(units).toEqual({ infantry: 0, cavalry: 0, settler: 1 })
    })

    it('refuses a second founding to a reserved plot', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      const bruno = await signUpWithASettler('bruno@example.com', 'Robledal')
      await found(ana, foundingOnFreePlot())

      const response = await found(bruno, foundingOnFreePlot())

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'PlotReserved',
        message: 'Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.',
      })
      const { march } = FiefOverviewSchema.parse(await (await fiefOf(bruno)).json())
      expect(march).toBeNull()
    })

    it('frees the plot when the founding is recalled', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      const bruno = await signUpWithASettler('bruno@example.com', 'Robledal')
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(5)
      await app.request(
        pathOf(ana, `/marches/${encodeURIComponent('2026-09-22T08:00:00.000Z')}/recall`),
        { method: 'POST', headers: { cookie: ana.cookie } },
      )

      const response = await found(bruno, foundingOnFreePlot())

      expect(response.status).toBe(200)
    })

    it('signs up a new lord past a reserved plot', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, { province: 1, plot: 2, name: 'Sotoverde del Páramo' })

      const carla = await signUp('carla@example.com', 'Pedregal')

      const stored = await storedFiefOf(carla)
      assert(stored.ok)
      expect(stored.value?.coordinates).toMatchObject({ kingdom: 1, province: 1, plot: 3 })
    })

    const minutesToArrivalAt = (plot: number): number => 10 + (plot - 1)

    const foundedFiefOf = async (lord: Lord): Promise<Lord> => {
      const response = await app.request('/fiefs', { headers: { cookie: lord.cookie } })
      const founded = FiefListSchema.parse(await response.json()).fiefs.find(
        ({ id }) => id !== lord.fiefId,
      )
      assert(founded !== undefined)
      return { cookie: lord.cookie, fiefId: founded.id }
    }

    it('lists both fiefs after a read past the arrival', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()))

      const response = await app.request('/fiefs', { headers: { cookie: ana.cookie } })

      expect(response.status).toBe(200)
      const { fiefs } = FiefListSchema.parse(await response.json())
      expect(fiefs.map(({ name, coordinates }) => ({ name, coordinates }))).toEqual([
        { name: 'Valdehierro', coordinates: { kingdom: 1, province: 1, plot: 1 } },
        {
          name: 'Sotoverde del Páramo',
          coordinates: { kingdom: 1, province: 2, plot: freePlot() },
        },
      ])
    })

    it('reads the new fief by its id', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()) + 60)
      const founded = await foundedFiefOf(ana)

      const response = await fiefOf(founded)

      expect(response.status).toBe(200)
      const { resources, buildings, arts, units, march } = FiefOverviewSchema.parse(
        await response.json(),
      )
      expect({
        amounts: Object.values(resources).map(({ amount }) => amount),
        levels: [...new Set(Object.values(buildings).map(({ level }) => level))],
        artLevels: [...new Set(Object.values(arts).map(({ level }) => level))],
        units,
        march,
      }).toEqual({
        amounts: [510, 514, 205, 52, 310],
        levels: [0],
        artLevels: [0],
        units: { infantry: 0, cavalry: 0, settler: 0 },
        march: null,
      })
    })

    it('frees the settler and its peasants at the origin after the founding', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      const before = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()))

      const { units, peasants, march } = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect({ units, free: peasants.free - before.peasants.free, march }).toEqual({
        units: { infantry: 0, cavalry: 0, settler: 0 },
        free: 4,
        march: null,
      })
    })

    it('turns the settler home when a fief holds the plot at the arrival', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())
      await signUp('bruno@example.com', 'Robledal')
      await runSql(`UPDATE fiefs SET province = 2, plot = ${freePlot()} WHERE name = 'Robledal'`)
      clock.advanceMinutes(minutesToArrivalAt(freePlot()))

      const atArrival = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()))
      const home = FiefOverviewSchema.parse(await (await fiefOf(ana)).json())

      expect({
        recalledAt: atArrival.march?.recalledAt,
        fiefs: await server.fiefs.fiefsOf(ana.playerId),
        march: home.march,
        units: home.units,
      }).toEqual({
        recalledAt: new Date(
          signedUpAt + minutesToArrivalAt(freePlot()) * millisecondsPerMinute,
        ).toISOString(),
        fiefs: [ana.fiefId],
        march: null,
        units: { infantry: 0, cavalry: 0, settler: 1 },
      })
    })

    const chronicleEventsOf = async (lord: Lord): Promise<FiefChronicle['events']> =>
      FiefChronicleSchema.parse(
        await (
          await app.request(pathOf(lord, '/events'), { headers: { cookie: lord.cookie } })
        ).json(),
      ).events

    const fiefFoundedAtTheArrival = () => ({
      kind: 'fiefFounded',
      province: 2,
      plot: freePlot(),
      name: 'Sotoverde del Páramo',
      occurredAt: new Date(
        signedUpAt + minutesToArrivalAt(freePlot()) * millisecondsPerMinute,
      ).toISOString(),
    })

    it('lists the founding march sent in the origin chronicle', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())

      expect(await chronicleEventsOf(ana)).toEqual([
        {
          kind: 'foundingSent',
          province: 2,
          plot: freePlot(),
          name: 'Sotoverde del Páramo',
          occurredAt: '2026-09-22T08:00:00.000Z',
        },
      ])
    })

    it('lists the fief founded in both chronicles at the arrival', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()))
      const founded = await foundedFiefOf(ana)

      const origin = await chronicleEventsOf(ana)
      const newFief = await chronicleEventsOf(founded)

      expect(origin.map(({ kind }) => kind)).toEqual(['fiefFounded', 'foundingSent'])
      expect(origin[0]).toEqual(fiefFoundedAtTheArrival())
      expect(newFief).toContainEqual(fiefFoundedAtTheArrival())
    })

    it('opens the new fief chronicle with its founding alone', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()) + 60)
      const founded = await foundedFiefOf(ana)

      expect(await chronicleEventsOf(founded)).toEqual([fiefFoundedAtTheArrival()])
    })

    it('refuses a founding from a lord of two fiefs', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
      await found(ana, foundingOnFreePlot())
      clock.advanceMinutes(minutesToArrivalAt(freePlot()))
      await foundedFiefOf(ana)
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'settler'::unit, 1 FROM fiefs WHERE name = 'Valdehierro'`)

      const response = await found(ana, { ...foundingOnFreePlot(), plot: freePlot() + 1 })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toMatchObject({
        kind: 'FiefCapReached',
      })
    })

    it('answers 400 for a founding without a name', async () => {
      const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')

      const response = await found(ana, { province: 2, plot: freePlot() })

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('')
    })
  })

  describe('the transport route', () => {
    const otherFiefId = '00000000-0000-4000-8000-0000000000f2'

    const transport = async (lord: Lord, body: unknown): Promise<Response> =>
      app.request(pathOf(lord, '/marches/transport'), {
        method: 'POST',
        headers: { cookie: lord.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    const fullStores = { wood: 1000, stone: 1000, iron: 1000, gold: 1000, food: 1000 }

    const signUpWithSixRidersAndAFullFief = async (): Promise<SignedUpPlayer> => {
      const ana = await signUp('ana@example.com', 'Valdehierro')
      await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
        SELECT id, 'farm'::building, 8 FROM fiefs`)
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'cavalry'::unit, 6 FROM fiefs`)
      const name = FiefName.create('Peña Alta')
      const coordinates = Coordinates.create(1, 2, 1)
      assert(name.ok && coordinates.ok)
      const saved = await server.inTransaction(({ fiefs }) =>
        fiefs.save(
          Fief.found({
            id: otherFiefId,
            playerId: ana.playerId,
            name: name.value,
            coordinates: coordinates.value,
            startingStocks: fullStores,
            at: Instant.fromEpochMilliseconds(signedUpAt),
          }),
        ),
      )
      assert(saved.ok)
      return ana
    }

    const otherFiefOf = (lord: Lord): Lord => ({ cookie: lord.cookie, fiefId: otherFiefId })

    const woodAndStone = { wood: 300, stone: 200, iron: 0, gold: 0, food: 0 }

    const sixRiders = { infantry: 0, cavalry: 6, settler: 0 }

    const amountsOf = ({ resources }: FiefOverview) => ({
      wood: resources.wood.amount,
      stone: resources.stone.amount,
      iron: resources.iron.amount,
      gold: resources.gold.amount,
      food: resources.food.amount,
    })

    const stocksOf = async (lord: Lord) => {
      const response = await fiefOf(lord)
      expect(response.status).toBe(200)
      return amountsOf(FiefOverviewSchema.parse(await response.json()))
    }

    it('sends a transport and answers it outbound', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      const response = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: woodAndStone,
      })

      expect(response.status).toBe(200)
      const { march } = FiefOverviewSchema.parse(await response.json())
      expect(march).toMatchObject({
        order: 'transport',
        toFiefId: otherFiefId,
        cargo: woodAndStone,
        province: 2,
        plot: 1,
        units: sixRiders,
        stayHours: 0,
        oneWaySeconds: 300,
        arrivesAt: '2026-09-22T08:05:00.000Z',
        returnsAt: '2026-09-22T08:10:00.000Z',
      })
    })

    it('debits the cargo from the stores it leaves', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      const response = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: woodAndStone,
      })

      expect(amountsOf(FiefOverviewSchema.parse(await response.json()))).toEqual({
        wood: 200,
        stone: 300,
        iron: 200,
        gold: 50,
        food: 300,
      })
    })

    it('reads the cargo in the other fief after the arrival', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()
      await transport(ana, { toFiefId: otherFiefId, units: sixRiders, cargo: woodAndStone })
      clock.advanceMinutes(5)

      expect(await stocksOf(otherFiefOf(ana))).toMatchObject({
        wood: 1300,
        stone: 1200,
        iron: 1000,
        gold: 1000,
        food: 1000,
      })
    })

    it('reads no cargo in the other fief before the arrival', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()
      await transport(ana, { toFiefId: otherFiefId, units: sixRiders, cargo: woodAndStone })
      clock.advanceMinutes(4)

      expect(await stocksOf(otherFiefOf(ana))).toMatchObject(fullStores)
    })

    it('credits an arrived cargo before storing the next one', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()
      await transport(ana, { toFiefId: otherFiefId, units: sixRiders, cargo: woodAndStone })
      clock.advanceMinutes(10)
      const next = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: { wood: 100, stone: 0, iron: 0, gold: 0, food: 0 },
      })
      expect(next.status).toBe(200)
      clock.advanceMinutes(5)

      expect(await stocksOf(otherFiefOf(ana))).toMatchObject({ wood: 1400, stone: 1200 })
    })

    it('stores the cargo of the other fief until its arrival', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      await transport(ana, { toFiefId: otherFiefId, units: sixRiders, cargo: woodAndStone })

      const stored = await server.fiefs.fiefOf(otherFiefId)
      assert(stored.ok)
      expect(stored.value?.incomingCargo).toMatchObject({
        fromFiefId: ana.fiefId,
        name: 'Valdehierro',
        province: 1,
        plot: 1,
        cargo: woodAndStone,
      })
    })

    it('answers a cargo above the stores with the line of the cargo', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      const response = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: { wood: 600, stone: 0, iron: 0, gold: 0, food: 0 },
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'InsufficientResources',
        message: 'No tienes recursos suficientes para esa carga. Ajusta las cantidades.',
      })
    })

    it('answers a cargo above the carry with both figures', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      const response = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: { wood: 300, stone: 300, iron: 121, gold: 0, food: 0 },
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'CargoAboveCarry',
        message:
          'La carga suma 721 y tus hombres llevan hasta 720. Quita carga o envía más hombres.',
      })
    })

    it('answers an empty cargo', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      const response = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      })

      expect(response.status).toBe(409)
      expect(ApiErrorSchema.parse(await response.json())).toEqual({
        kind: 'EmptyCargo',
        message: 'Un transporte no sale de vacío. Carga al menos un recurso.',
      })
    })

    it('answers a transport to the fief of another lord as no fief', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()
      const bruno = await signUp('bruno@example.com', 'Robledal')

      const response = await transport(ana, {
        toFiefId: bruno.fiefId,
        units: sixRiders,
        cargo: woodAndStone,
      })

      expect(response.status).toBe(404)
    })

    it('refuses a transport that names a plot', async () => {
      const ana = await signUpWithSixRidersAndAFullFief()

      const response = await transport(ana, {
        toFiefId: otherFiefId,
        units: sixRiders,
        cargo: woodAndStone,
        province: 2,
      })

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('')
    })
  })
})

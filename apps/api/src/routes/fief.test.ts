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
    expect(overview.resources.wood).toEqual({ amount: 500, ratePerHour: 0, capacity: 1000 })
    expect(overview.peasants).toEqual({ supplied: 10, occupied: 0, free: 10 })
    expect(overview.slot).toEqual({ kind: 'idle' })
    expect(overview.readAt).toBe('2026-09-22T08:00:00.000Z')
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
    expect(overview.buildings.sawmill).toBe(1)
    expect(overview.resources.wood.ratePerHour).toBe(30)
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
    expect(resources.food).toEqual({ amount: 307, ratePerHour: 5, capacity: 1000 })
    expect(resources.wood).toEqual({ amount: 500, ratePerHour: 0, capacity: 1000 })
  })

  it('answers a finished upgrade with the amounts accrued at the old rate then the new one', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    await enqueueSawmill(ana.playerId)
    clock.advanceMinutes(90)

    const response = await fiefOf(ana.cookie)

    const { resources } = FiefOverviewSchema.parse(await response.json())
    expect(resources.wood.amount).toBe(484)
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
    expect(overview.resources.wood.amount).toBe(441)
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
})

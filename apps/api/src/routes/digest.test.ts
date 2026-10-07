import { fileURLToPath } from 'node:url'
import { type Digest, DigestSchema, PlayerSchema } from '@mygame/contracts'
import {
  type Clock,
  Coordinates,
  Fief,
  type FiefEvent,
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

const millisecondsPerHour = 3_600_000

const millisecondsPerMinute = 60_000

const signedUpAt = Date.parse('2026-10-06T08:00:00Z')

type MovableClock = Clock & {
  readonly advanceMinutes: (minutes: number) => void
  readonly advanceHours: (hours: number) => void
}

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  return {
    now: () => current,
    advanceMinutes: (minutes) => {
      current = Instant.fromEpochMilliseconds(
        current.epochMilliseconds + minutes * millisecondsPerMinute,
      )
    },
    advanceHours: (hours) => {
      current = Instant.fromEpochMilliseconds(
        current.epochMilliseconds + hours * millisecondsPerHour,
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

const isoAfter = (hours: number): string =>
  new Date(signedUpAt + hours * millisecondsPerHour).toISOString()

const instantAfter = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(signedUpAt + hours * millisecondsPerHour)

const sawmillFinishedAfter = (hours: number): FiefEvent => ({
  kind: 'upgradeFinished',
  building: 'sawmill',
  level: 1,
  occurredAt: instantAfter(hours),
})

const statementTextOf = (query: unknown): string => {
  if (typeof query === 'string') {
    return query
  }
  if (typeof query === 'object' && query !== null && 'text' in query) {
    return String(query.text)
  }
  return ''
}

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

type SignedUpPlayer = {
  readonly cookie: string
  readonly playerId: PlayerId
}

describe('the digest routes', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3197', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  const signUpAna = async (): Promise<SignedUpPlayer> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
        fiefName: 'Valdehierro',
      }),
    })
    const player = PlayerSchema.parse(await response.json())
    return { cookie: sessionCookieOf(response), playerId: player.id }
  }

  const acknowledge = async ({ cookie }: SignedUpPlayer): Promise<Response> =>
    app.request('/digest/acknowledgement', { method: 'POST', headers: { cookie } })

  it('stores the acknowledgement at the clock instant', async () => {
    const ana = await signUpAna()
    clock.advanceHours(5)

    const response = await acknowledge(ana)

    expect(response.status).toBe(204)
    expect(await server.digestAcknowledgements.acknowledgedAt(ana.playerId)).toEqual(clock.now())
  })

  it('refuses an acknowledgement without a session', async () => {
    const response = await app.request('/digest/acknowledgement', { method: 'POST' })

    expect(response.status).toBe(401)
  })

  it('reads the session without writing the acknowledgement', async () => {
    const ana = await signUpAna()
    clock.advanceHours(5)

    const session = await app.request('/auth/session', { headers: { cookie: ana.cookie } })

    expect(session.status).toBe(200)
    PlayerSchema.parse(await session.json())
    expect(await server.digestAcknowledgements.acknowledgedAt(ana.playerId)).toEqual(
      Instant.fromEpochMilliseconds(signedUpAt),
    )
  })

  const secondFiefId = '00000000-0000-4000-8000-0000000000d2'

  const firstFiefOf = async ({ playerId }: SignedUpPlayer): Promise<FiefId> => {
    const [fiefId] = await server.fiefs.fiefsOf(playerId)
    assert(fiefId !== undefined)
    return fiefId
  }

  const foundSecondFief = async ({ playerId }: SignedUpPlayer): Promise<void> => {
    const name = FiefName.create('Peña Alta')
    const coordinates = Coordinates.create(1, 2, 1)
    assert(name.ok && coordinates.ok)
    const saved = await server.inTransaction(({ fiefs }) =>
      fiefs.save(
        Fief.found({
          id: secondFiefId,
          playerId,
          name: name.value,
          coordinates: coordinates.value,
          startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
          at: Instant.fromEpochMilliseconds(signedUpAt),
        }),
      ),
    )
    assert(saved.ok)
  }

  const record = async (fiefId: FiefId, events: ReadonlyArray<FiefEvent>): Promise<void> => {
    const recorded = await server.inTransaction(({ chronicle }) => chronicle.record(fiefId, events))
    assert(recorded.ok)
  }

  const digestOf = async ({ cookie }: SignedUpPlayer): Promise<Digest> => {
    const response = await app.request('/digest', { headers: { cookie } })
    expect(response.status).toBe(200)
    return DigestSchema.parse(await response.json())
  }

  it('answers the events after the acknowledgement across both fiefs', async () => {
    const ana = await signUpAna()
    await foundSecondFief(ana)
    clock.advanceHours(2)
    await acknowledge(ana)
    await record(await firstFiefOf(ana), [sawmillFinishedAfter(3)])
    await record(secondFiefId, [sawmillFinishedAfter(4), sawmillFinishedAfter(5)])
    clock.advanceHours(4)

    const { fiefs } = await digestOf(ana)

    expect(fiefs.map(({ name, events }) => ({ name, events }))).toEqual([
      {
        name: 'Valdehierro',
        events: [
          { kind: 'upgradeFinished', building: 'sawmill', level: 1, occurredAt: isoAfter(3) },
        ],
      },
      {
        name: 'Peña Alta',
        events: [
          { kind: 'upgradeFinished', building: 'sawmill', level: 1, occurredAt: isoAfter(5) },
          { kind: 'upgradeFinished', building: 'sawmill', level: 1, occurredAt: isoAfter(4) },
        ],
      },
    ])
  })

  it('leaves out an event at or before the acknowledgement', async () => {
    const ana = await signUpAna()
    clock.advanceHours(2)
    await acknowledge(ana)
    await record(await firstFiefOf(ana), [
      sawmillFinishedAfter(1),
      sawmillFinishedAfter(2),
      sawmillFinishedAfter(3),
    ])
    clock.advanceHours(2)

    const [valdehierro] = (await digestOf(ana)).fiefs

    expect(valdehierro?.events.map(({ occurredAt }) => occurredAt)).toEqual([isoAfter(3)])
  })

  it('names a store that filled after the acknowledgement with its fill instant', async () => {
    const ana = await signUpAna()
    clock.advanceHours(3)
    await runSql(
      `UPDATE fiefs SET food = 1000, stored_at = '${isoAfter(2)}', full_since_food = '${isoAfter(1)}'`,
    )

    const [valdehierro] = (await digestOf(ana)).fiefs

    expect(valdehierro?.stores).toEqual([{ resource: 'food', fullSince: isoAfter(1) }])
  })

  it('names a store that filled with no save since', async () => {
    const ana = await signUpAna()
    clock.advanceHours(40)

    const [valdehierro] = (await digestOf(ana)).fiefs

    expect(valdehierro?.stores).toEqual([
      { resource: 'food', fullSince: '2026-10-07T21:20:00.000Z' },
    ])
  })

  it('leaves out a store already full at the acknowledgement', async () => {
    const ana = await signUpAna()
    clock.advanceHours(40)
    await acknowledge(ana)
    clock.advanceHours(2)

    const [valdehierro] = (await digestOf(ana)).fiefs

    expect(valdehierro?.stores).toEqual([])
  })

  it('is due once the absence passes with something to tell', async () => {
    const ana = await signUpAna()
    await record(await firstFiefOf(ana), [sawmillFinishedAfter(0.5)])
    clock.advanceHours(1)

    expect((await digestOf(ana)).isDue).toBe(true)
  })

  it('is due when only a store filled after the acknowledgement', async () => {
    const ana = await signUpAna()
    clock.advanceHours(40)

    const digest = await digestOf(ana)

    expect({ isDue: digest.isDue, events: digest.fiefs[0]?.events }).toEqual({
      isDue: true,
      events: [],
    })
  })

  it('is not due within the absence threshold', async () => {
    const ana = await signUpAna()
    await record(await firstFiefOf(ana), [sawmillFinishedAfter(0.5)])
    clock.advanceMinutes(59)

    const digest = await digestOf(ana)

    expect({ isDue: digest.isDue, events: digest.fiefs[0]?.events.length }).toEqual({
      isDue: false,
      events: 1,
    })
  })

  it('is not due when nothing happened', async () => {
    const ana = await signUpAna()
    clock.advanceHours(5)

    expect(await digestOf(ana)).toEqual({
      acknowledgedAt: isoAfter(0),
      isDue: false,
      fiefs: [{ id: await firstFiefOf(ana), name: 'Valdehierro', events: [], stores: [] }],
    })
  })

  it('keeps the acknowledgement on a read', async () => {
    const ana = await signUpAna()
    clock.advanceHours(5)

    await digestOf(ana)

    expect(await server.digestAcknowledgements.acknowledgedAt(ana.playerId)).toEqual(
      instantAfter(0),
    )
  })

  it('refuses a digest without a session', async () => {
    const response = await app.request('/digest')

    expect(response.status).toBe(401)
  })

  it('reads two fiefs with nothing to resolve in eight round trips to the store', async () => {
    const ana = await signUpAna()
    await foundSecondFief(ana)
    clock.advanceHours(2)
    const statements: Array<string> = []
    const query = Client.prototype.query
    vi.spyOn(Client.prototype, 'query').mockImplementation(function (
      this: Client,
      ...parameters: Parameters<typeof query>
    ) {
      statements.push(statementTextOf(parameters[0]))
      return Reflect.apply(query, this, parameters)
    })

    await digestOf(ana)

    expect(statements).toHaveLength(8)
  })
})

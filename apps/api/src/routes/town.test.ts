import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  CleanUpQuoteSchema,
  JobQuoteSchema,
  PlayerSchema,
  RegionMapSchema,
  ReviewsSchema,
  type SendCleanUp,
  type TownNewsFeed,
  TownNewsFeedSchema,
  type TownOverview,
  TownOverviewSchema,
} from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
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
import type { Transaction, TransactionStores } from '../adapters/postgres/postgresTransaction'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'
import {
  isWaitingOnALock,
  lockedPlayerReadQuery,
  lockProbeLimit,
} from '../lockWaitProbe.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const millisecondsPerMinute = 60_000

const signedUpAt = Date.parse('2026-11-05T08:00:00Z')

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

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

const jsonRequest = (method: string, cookie: string, body: unknown): RequestInit => ({
  method,
  headers: { cookie, 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const pausingFirstRead = (
  towns: TransactionStores['towns'],
  afterRead: () => Promise<void>,
): TransactionStores['towns'] => {
  let hasRead = false
  return {
    townWithSchoolOf: (playerId) => towns.townWithSchoolOf(playerId),
    holdsTown: (playerId) => towns.holdsTown(playerId),
    occupiedSites: () => towns.occupiedSites(),
    save: (town) => towns.save(town),
    townOf: async (playerId) => {
      const read = await towns.townOf(playerId)
      if (!hasRead) {
        hasRead = true
        await afterRead()
      }
      return read
    },
  }
}

const pausingFirstTransaction = (
  inTransaction: Transaction,
  afterFirstRead: () => Promise<void>,
): Transaction => {
  let transactions = 0
  return (work) => {
    transactions += 1
    const isFirst = transactions === 1
    return inTransaction((stores) =>
      work(isFirst ? { ...stores, towns: pausingFirstRead(stores.towns, afterFirstRead) } : stores),
    )
  }
}

const untilPlayerBlockedOrRead = async (secondRead: Promise<unknown>): Promise<void> => {
  let hasRead = false
  void secondRead.then(() => {
    hasRead = true
  })
  const observer = new Client({ connectionString: databaseUrl() })
  await observer.connect()
  try {
    for (let probes = 0; probes < lockProbeLimit; probes += 1) {
      if (hasRead || (await isWaitingOnALock(observer, [lockedPlayerReadQuery]))) {
        return
      }
    }
    throw new Error('The second start neither waited on the player lock nor finished')
  } finally {
    await observer.end()
  }
}

describe('the town route', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const signUp = async (email: string): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana' }),
    })
    PlayerSchema.parse(await response.json())
    return sessionCookieOf(response)
  }

  const foundTown = (cookie: string, body: unknown): Promise<Response> =>
    Promise.resolve(app.request('/town', jsonRequest('POST', cookie, body)))

  const signUpWithTown = async (email: string): Promise<string> => {
    const cookie = await signUp(email)
    expect((await foundTown(cookie, { name: 'Maple Falls' })).status).toBe(200)
    return cookie
  }

  const readTown = (cookie: string): Promise<Response> =>
    Promise.resolve(app.request('/town', { headers: { cookie } }))

  const startWork = (cookie: string, building: string): Promise<Response> =>
    Promise.resolve(app.request('/town/work', jsonRequest('POST', cookie, { building })))

  const stopWork = (cookie: string, building: string, level: number | string): Promise<Response> =>
    Promise.resolve(
      app.request(`/town/work/${building}/${level}`, { method: 'DELETE', headers: { cookie } }),
    )

  const overviewOf = async (response: Response): Promise<TownOverview> =>
    TownOverviewSchema.parse(await response.json())

  const refusalOf = async (response: Response): Promise<unknown> =>
    ApiErrorSchema.parse(await response.json())

  const amountsOf = (overview: TownOverview): Record<string, number> => ({
    money: overview.stocks.money.amount,
    food: overview.stocks.food.amount,
    power: overview.stocks.power.amount,
    material: overview.stocks.material.amount,
  })

  const fillStocks = (): Promise<void> =>
    runSql('UPDATE towns SET money = 100000, food = 100000, power = 100000, material = 100000')

  describe('the founding', () => {
    it('founds a town at the lowest free site', async () => {
      await signUpWithTown('ana@example.com')
      const bea = await signUp('bea@example.com')

      const response = await foundTown(bea, { name: 'Cedar Point' })

      expect(response.status).toBe(200)
      expect((await overviewOf(response)).site).toEqual({ region: 1, area: 1, site: 2 })
    })

    it('keeps the town name as written, trimmed', async () => {
      const ana = await signUp('ana@example.com')

      const response = await foundTown(ana, { name: '  McAllen Heights ' })

      expect((await overviewOf(response)).name).toBe('McAllen Heights')
    })

    it('refuses a second town', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await foundTown(ana, { name: 'Cedar Point' })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'PlayerAlreadyHoldsTown' })
    })

    it('refuses a name of spaces as a blank town name', async () => {
      const ana = await signUp('ana@example.com')

      const response = await foundTown(ana, { name: '   ' })

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({ kind: 'BlankTownName' })
    })

    it('answers a malformed body with an empty 400', async () => {
      const ana = await signUp('ana@example.com')

      const response = await foundTown(ana, { title: 'Maple Falls' })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })
  })

  describe('the read', () => {
    it('reads the town with its stocks, people, buildings, label, site and season', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const overview = await overviewOf(await readTown(ana))

      expect(overview).toMatchObject({
        name: 'Maple Falls',
        label: 'town',
        site: { region: 1, area: 1, site: 1 },
        terrain: 'fields',
        season: { kind: 'spring', year: 2, endsAt: '2026-11-09T00:00:00.000Z' },
        stocks: {
          money: { amount: 400, ratePerHour: 20, capacity: 1000 },
          food: { amount: 300, ratePerHour: 5, capacity: 1000 },
          power: { amount: 200, ratePerHour: 0, capacity: 1000 },
          material: { amount: 500, ratePerHour: 0, capacity: 1000 },
        },
        people: { supplied: 20, free: 19, atWork: 1 },
        work: { slot: null, waitingList: [], cap: 4 },
        readAt: '2026-11-05T08:00:00.000Z',
      })
    })

    it('answers the instant each store fills', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const { stocks } = await overviewOf(await readTown(ana))

      expect([stocks.money.fullAt, stocks.food.fullAt]).toEqual([
        '2026-11-06T14:00:00.000Z',
        '2026-11-10T17:36:00.000Z',
      ])
    })

    it('answers no fill instant for a store that never fills', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const { stocks } = await overviewOf(await readTown(ana))

      expect([stocks.power.fullAt, stocks.material.fullAt]).toEqual([null, null])
    })

    it('offers each building’s next level with its cost, duration and people', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const { buildings } = await overviewOf(await readTown(ana))

      expect([buildings.homes, buildings.farm]).toEqual([
        {
          level: 1,
          nextLevel: {
            level: 2,
            cost: { money: 90, food: 60, power: 0, material: 120 },
            durationSeconds: 192,
            people: 0,
          },
        },
        {
          level: 0,
          nextLevel: {
            level: 1,
            cost: { money: 50, food: 0, power: 0, material: 70 },
            durationSeconds: 120,
            people: 1,
          },
        },
      ])
    })

    it('accrues the stocks to the read', async () => {
      const ana = await signUpWithTown('ana@example.com')
      clock.advanceMinutes(60)

      const overview = await overviewOf(await readTown(ana))

      expect(amountsOf(overview)).toEqual({ money: 420, food: 305, power: 200, material: 500 })
    })

    it('applies finished work on the next read', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      clock.advanceMinutes(3)

      await readTown(ana)
      const overview = await overviewOf(await readTown(ana))

      expect([overview.buildings.farm.level, overview.work.slot]).toEqual([1, null])
    })

    it('reads the town in one round trip', async () => {
      const ana = await signUpWithTown('ana@example.com')
      const statements: Array<string> = []
      const query = Client.prototype.query
      vi.spyOn(Client.prototype, 'query').mockImplementation(function (
        this: Client,
        ...parameters: Parameters<typeof query>
      ) {
        statements.push(statementTextOf(parameters[0]))
        return Reflect.apply(query, this, parameters)
      })

      await readTown(ana)

      expect(statements.filter((statement) => !statement.includes('"sessions"'))).toEqual([
        expect.stringContaining('from "towns"'),
      ])
    })

    it('refuses a player with no town as TownNotFound', async () => {
      const ana = await signUp('ana@example.com')

      const response = await readTown(ana)

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })
  })

  describe('the start of work', () => {
    it('starts work and debits its cost', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(200)
      const overview = await overviewOf(response)
      expect([amountsOf(overview), overview.work.slot]).toEqual([
        { money: 350, food: 300, power: 200, material: 430 },
        {
          building: 'farm',
          level: 1,
          cost: { money: 50, food: 0, power: 0, material: 70 },
          startsAt: '2026-11-05T08:00:00.000Z',
          finishesAt: '2026-11-05T08:02:00.000Z',
        },
      ])
    })

    it('keeps the debited stocks for the next read', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')

      const overview = await overviewOf(await readTown(ana))

      expect(amountsOf(overview)).toEqual({ money: 350, food: 300, power: 200, material: 430 })
    })

    it('queues work behind a busy slot', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')

      const overview = await overviewOf(await startWork(ana, 'farm'))

      expect(overview.work.waitingList).toEqual([
        {
          building: 'farm',
          level: 2,
          cost: { money: 75, food: 0, power: 0, material: 105 },
          startsAt: '2026-11-05T08:02:00.000Z',
          finishesAt: '2026-11-05T08:05:12.000Z',
        },
      ])
    })

    it('refuses work past the cap', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await fillStocks()
      for (let started = 0; started < 5; started += 1) {
        expect((await startWork(ana, 'farm')).status).toBe(200)
      }

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'WaitingListFull', params: { cap: 4 } })
    })

    it('refuses work the stocks cannot pay with what they miss', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql('UPDATE towns SET money = 10')

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughResources',
        params: { missing: { money: 40, food: 0, power: 0, material: 0 } },
      })
    })

    it('refuses work with too few free people', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql(
        "UPDATE town_buildings SET level = CASE building WHEN 'factory' THEN 10 ELSE 9 END WHERE building IN ('factory', 'power_station')",
      )

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughPeople',
        params: { requiredPeople: 1, freePeople: 0 },
      })
    })

    it('refuses work past the top level', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql("UPDATE town_buildings SET level = 10 WHERE building = 'farm'")

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'TopLevelReached',
        params: { building: 'farm', level: 10 },
      })
    })

    it('refuses work for a player with no town as TownNotFound', async () => {
      const ana = await signUp('ana@example.com')

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })

    it('answers a building the town lacks with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await startWork(ana, 'stadium')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent starts', async () => {
      const ana = await signUpWithTown('ana@example.com')
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const start = (): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/work', jsonRequest('POST', ana, { building: 'farm' })),
        )

      const first = start()
      await firstHasRead.promise
      const second = start().then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([
        statuses,
        overview.work.slot?.level,
        overview.work.waitingList.map(({ level }) => level),
        amountsOf(overview),
      ]).toEqual([[200, 200], 1, [2], { money: 275, food: 300, power: 200, material: 325 }])
    })
  })

  describe('the stop of work', () => {
    it('stops work and refunds it in full', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      clock.advanceMinutes(1)

      const response = await stopWork(ana, 'farm', 1)

      expect(response.status).toBe(200)
      const overview = await overviewOf(response)
      expect([amountsOf(overview), overview.work.slot]).toEqual([
        { money: 400, food: 300, power: 200, material: 500 },
        null,
      ])
    })

    it('refuses a stop of work that is not there', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await stopWork(ana, 'farm', 1)

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'BuildingWorkNotFound',
        params: { building: 'farm', level: 1 },
      })
    })

    it('answers a level that is not a whole count from 1 with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await stopWork(ana, 'farm', 0)

      expect([response.status, await response.text()]).toEqual([400, ''])
    })
  })

  describe('the hiring', () => {
    const buildOffice = (level: number): Promise<void> =>
      runSql(`UPDATE town_buildings SET level = ${level} WHERE building = 'office'`)

    const placeHiring = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/hiring', jsonRequest('POST', cookie, body)))

    const stopHiring = (cookie: string, hire: string, startedAt: string): Promise<Response> =>
      Promise.resolve(
        app.request(`/town/hiring/${hire}/${encodeURIComponent(startedAt)}`, {
          method: 'DELETE',
          headers: { cookie },
        }),
      )

    it('places a hiring order and charges it', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const response = await placeHiring(ana, { hire: 'worker', count: 3 })

      expect(response.status).toBe(200)
      const overview = await overviewOf(response)
      expect([amountsOf(overview), overview.hiring.order, overview.hiring.hires]).toEqual([
        { money: 280, food: 300, power: 200, material: 500 },
        {
          hire: 'worker',
          count: 3,
          delivered: 0,
          secondsPerHire: 45,
          startedAt: '2026-11-05T08:00:00.000Z',
          endsAt: '2026-11-05T08:02:15.000Z',
        },
        { worker: 0, truck: 0 },
      ])
    })

    it('delivers each hire on the read after its time', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })
      clock.advanceMinutes(2)

      const overview = await overviewOf(await readTown(ana))

      expect([overview.hiring.order?.delivered, overview.hiring.hires]).toEqual([
        2,
        { worker: 2, truck: 0 },
      ])
    })

    it('closes the order at its last delivery', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })
      clock.advanceMinutes(3)

      const overview = await overviewOf(await readTown(ana))

      expect([overview.hiring.order, overview.hiring.hires]).toEqual([
        null,
        { worker: 3, truck: 0 },
      ])
    })

    it('answers each kind’s terms at the built office level and the spring hire percent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const overview = await overviewOf(await readTown(ana))

      expect(overview.hiring.terms).toEqual({
        worker: {
          cost: { money: 40, food: 0, power: 0, material: 0 },
          secondsPerHire: 45,
          people: 1,
          requiredOfficeLevel: 1,
        },
        truck: {
          cost: { money: 80, food: 40, power: 40, material: 60 },
          secondsPerHire: 135,
          people: 1,
          requiredOfficeLevel: 3,
        },
      })
    })

    it('refuses a second order while one is open', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 1 })

      const response = await placeHiring(ana, { hire: 'worker', count: 1 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'HiringSlotBusy',
        params: { hire: 'worker' },
      })
    })

    it('refuses trucks below office level 3', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(2)

      const response = await placeHiring(ana, { hire: 'truck', count: 1 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'OfficeTooLow',
        params: { hire: 'truck', requiredOfficeLevel: 3, officeLevel: 2 },
      })
    })

    it('refuses an order the free people cannot staff', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      const { people } = await overviewOf(await readTown(ana))
      await fillStocks()

      const response = await placeHiring(ana, { hire: 'worker', count: people.free + 1 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughPeople',
        params: { requiredPeople: people.free + 1, freePeople: people.free },
      })
    })

    it('refuses an order the stocks cannot pay with what they miss', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await runSql('UPDATE towns SET money = 50')

      const response = await placeHiring(ana, { hire: 'worker', count: 2 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughResources',
        params: { missing: { money: 30, food: 0, power: 0, material: 0 } },
      })
    })

    it('answers a count that is not a whole count from 1 with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const response = await placeHiring(ana, { hire: 'worker', count: 0 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('answers a hire the office lacks with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const response = await placeHiring(ana, { hire: 'van', count: 1 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('stops an order keeping the delivered', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })
      clock.advanceMinutes(1)

      const response = await stopHiring(ana, 'worker', '2026-11-05T08:00:00.000Z')

      expect(response.status).toBe(200)
      const overview = await overviewOf(response)
      expect([amountsOf(overview), overview.hiring.order, overview.hiring.hires]).toEqual([
        { money: 360, food: 300, power: 200, material: 500 },
        null,
        { worker: 1, truck: 0 },
      ])
    })

    it('refuses a stop naming another order', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })

      const response = await stopHiring(ana, 'worker', '2026-11-05T07:59:00.000Z')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'HiringOrderNotFound',
        params: { hire: 'worker', startedAt: '2026-11-05T07:59:00.000Z' },
      })
    })

    it('answers a start that is not an instant with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await stopHiring(ana, 'worker', 'yesterday')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent orders', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const place = (): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/hiring', jsonRequest('POST', ana, { hire: 'worker', count: 2 })),
        )

      const first = place()
      await firstHasRead.promise
      const second = place().then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([statuses, overview.hiring.order?.count, overview.stocks.money.amount]).toEqual([
        [200, 409],
        2,
        320,
      ])
    })
  })

  describe('the jobs', () => {
    const keepWorkers = (count: number): Promise<void> =>
      runSql(`UPDATE town_hires SET count = ${count} WHERE hire = 'worker'`)

    const sendJob = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/jobs', jsonRequest('POST', cookie, body)))

    const quoteJob = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/jobs/quote', jsonRequest('POST', cookie, body)))

    const callJobBack = (cookie: string, sentAt: string): Promise<Response> =>
      Promise.resolve(
        app.request(`/town/jobs/${encodeURIComponent(sentAt)}/call-back`, {
          method: 'POST',
          headers: { cookie },
        }),
      )

    const twoWorkersForTwoHours = (area: number, site: number): unknown => ({
      site: { area, site },
      team: { worker: 2, truck: 0 },
      hours: 2,
    })

    it('sends a job to a free site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(response.status).toBe(200)
      expect((await overviewOf(response)).job).toEqual({
        kind: 'job',
        site: { region: 1, area: 1, site: 3 },
        team: { worker: 2, truck: 0 },
        hours: 2,
        pay: { money: 0, food: 12, power: 0, material: 12 },
        phase: 'outbound',
        sentAt: '2026-11-05T08:00:00.000Z',
        arrivesAt: '2026-11-05T08:02:00.000Z',
        leavesAt: '2026-11-05T10:02:00.000Z',
        returnsAt: '2026-11-05T10:04:00.000Z',
        calledBackAt: null,
      })
    })

    it('keeps the job out for the next read', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      clock.advanceMinutes(5)

      const job = (await overviewOf(await readTown(ana))).job

      expect([job?.site, job?.phase]).toEqual([{ region: 1, area: 1, site: 3 }, 'working'])
    })

    it('credits the pay on the read after the return', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      const materialBefore = (await overviewOf(await readTown(ana))).stocks.material.amount
      clock.advanceMinutes(124)

      const overview = await overviewOf(await readTown(ana))

      expect([overview.job, overview.stocks.material.amount - materialBefore]).toEqual([null, 12])
    })

    it('refuses a job to a held site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await signUpWithTown('bea@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 2))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'SiteHeld' })
    })

    it('refuses a job to the town’s own site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 1))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'JobToOwnSite' })
    })

    it('refuses a job past the last browsable area', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(3, 1))

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({ kind: 'JobSiteOutOfBounds' })
    })

    it('refuses a team larger than the hires at home with the count at home', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(1)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughHiresAtHome',
        params: { hire: 'worker', count: 2, atHome: 1 },
      })
    })

    it('refuses a team of no hires', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await sendJob(ana, {
        site: { area: 1, site: 3 },
        team: { worker: 0, truck: 0 },
        hours: 2,
      })

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({ kind: 'InvalidTeam' })
    })

    it('refuses more hours than the content allows with the most allowed', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, { ...(twoWorkersForTwoHours(1, 3) as object), hours: 9 })

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({
        kind: 'JobHoursOutOfRange',
        params: { hours: 9, maxHours: 8 },
      })
    })

    it('refuses a second team while one is out', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(4)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 4))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'TeamAlreadyOut' })
    })

    it('answers a body of no hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await sendJob(ana, { ...(twoWorkersForTwoHours(1, 3) as object), hours: 0 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('refuses a job for a player with no town as TownNotFound', async () => {
      const ana = await signUp('ana@example.com')

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })

    it('answers the pay a job would bring before it is sent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const quoted = await quoteJob(ana, twoWorkersForTwoHours(1, 3))
      const sent = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(quoted.status).toBe(200)
      const quote = JobQuoteSchema.parse(await quoted.json())
      expect([quote.pay, (await overviewOf(sent)).job?.pay]).toEqual([
        { money: 0, food: 12, power: 0, material: 12 },
        { money: 0, food: 12, power: 0, material: 12 },
      ])
    })

    it('sends no team when it quotes a job', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await quoteJob(ana, twoWorkersForTwoHours(1, 3))

      const overview = await overviewOf(await readTown(ana))

      expect([overview.job, overview.hiring.hires.worker]).toEqual([null, 2])
    })

    it('refuses a quote the send would refuse', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await signUpWithTown('bea@example.com')
      await keepWorkers(2)

      const response = await quoteJob(ana, twoWorkersForTwoHours(1, 2))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'SiteHeld' })
    })

    it('answers a quote of no hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await quoteJob(ana, { ...(twoWorkersForTwoHours(1, 3) as object), hours: 0 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('calls a job back', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      clock.advanceMinutes(62)

      const response = await callJobBack(ana, '2026-11-05T08:00:00.000Z')

      expect(response.status).toBe(200)
      const job = (await overviewOf(response)).job
      expect([job?.pay, job?.phase, job?.calledBackAt, job?.leavesAt, job?.returnsAt]).toEqual([
        { money: 0, food: 6, power: 0, material: 6 },
        'returning',
        '2026-11-05T09:02:00.000Z',
        '2026-11-05T09:02:00.000Z',
        '2026-11-05T09:04:00.000Z',
      ])
    })

    it('refuses a call back naming another job', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))

      const response = await callJobBack(ana, '2026-11-05T07:00:00.000Z')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'JobNotFound' })
    })

    it('refuses a second call back of a returning job', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      clock.advanceMinutes(30)
      await callJobBack(ana, '2026-11-05T08:00:00.000Z')

      const response = await callJobBack(ana, '2026-11-05T08:00:00.000Z')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'JobAlreadyReturning' })
    })

    it('answers a send that is not an instant with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await callJobBack(ana, 'yesterday')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent sends', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(4)
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const send = (site: number): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/jobs', jsonRequest('POST', ana, twoWorkersForTwoHours(1, site))),
        )

      const first = send(3)
      await firstHasRead.promise
      const second = send(4).then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([statuses, overview.job?.site.site]).toEqual([[200, 409], 3])
    })
  })

  describe('the clean-ups', () => {
    const keepWorkers = (count: number): Promise<void> =>
      runSql(`UPDATE town_hires SET count = ${count} WHERE hire = 'worker'`)

    const sendCleanUp = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/clean-ups', jsonRequest('POST', cookie, body)))

    const sixWorkersTo = (area: number, site: number): SendCleanUp => ({
      site: { area, site },
      team: { worker: 6, truck: 0 },
    })

    const quoteCleanUp = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/clean-ups/quote', jsonRequest('POST', cookie, body)))

    it('sends a clean-up to a waste site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await sendCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(200)
      expect((await overviewOf(response)).job).toEqual({
        kind: 'cleanUp',
        site: { region: 1, area: 1, site: 12 },
        team: { worker: 6, truck: 0 },
        size: 1,
        waste: 6,
        pay: { money: 12, food: 0, power: 0, material: 18 },
        phase: 'outbound',
        sentAt: '2026-11-05T08:00:00.000Z',
        arrivesAt: '2026-11-05T08:11:00.000Z',
        leavesAt: '2026-11-05T08:11:00.000Z',
        returnsAt: '2026-11-05T08:22:00.000Z',
        calledBackAt: null,
      })
    })

    it('reads the site’s waste as 0 on the map once the team arrives', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await sendCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(11)

      const map = RegionMapSchema.parse(
        await (await app.request('/town/map', { headers: { cookie: ana } })).json(),
      )

      expect(map.sites.find(({ site }) => site === 12)?.waste).toEqual({ size: 1, waste: 0 })
    })

    it('refuses a clean-up to a site with no waste', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await sendCleanUp(ana, sixWorkersTo(1, 3))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NotAWasteSite' })
    })

    it('refuses a clean-up to a site whose waste has not grown back yet', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await sendCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(30)

      const response = await sendCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NoWasteYet' })
    })

    it('answers the strength, the waste and the pay a clean-up would bring before it is sent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const quoted = await quoteCleanUp(ana, sixWorkersTo(1, 12))

      expect(quoted.status).toBe(200)
      expect(CleanUpQuoteSchema.parse(await quoted.json())).toEqual({
        strength: 6,
        waste: 6,
        pay: { money: 12, food: 0, power: 0, material: 18 },
        covers: true,
      })
    })

    it('answers that a team whose strength falls short of the waste does not cover it', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(5)

      const quoted = await quoteCleanUp(ana, {
        site: { area: 1, site: 12 },
        team: { worker: 5, truck: 0 },
      })

      const quote = CleanUpQuoteSchema.parse(await quoted.json())
      expect([quote.strength, quote.waste, quote.covers]).toEqual([5, 6, false])
    })

    it('quotes the waste and the pay the send then fixes', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const quote = CleanUpQuoteSchema.parse(
        await (await quoteCleanUp(ana, sixWorkersTo(1, 12))).json(),
      )
      const job = (await overviewOf(await sendCleanUp(ana, sixWorkersTo(1, 12)))).job

      expect([quote.waste, quote.pay]).toEqual([
        job?.kind === 'cleanUp' ? job.waste : undefined,
        job?.pay,
      ])
    })

    it('sends no team when it quotes a clean-up', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await quoteCleanUp(ana, sixWorkersTo(1, 12))

      const overview = await overviewOf(await readTown(ana))

      expect([overview.job, overview.hiring.hires.worker]).toEqual([null, 6])
    })

    it('leaves the site’s waste as it was when it quotes a clean-up', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await quoteCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(11)

      const map = RegionMapSchema.parse(
        await (await app.request('/town/map', { headers: { cookie: ana } })).json(),
      )

      expect(map.sites.find(({ site }) => site === 12)?.waste).toEqual({ size: 1, waste: 6 })
    })

    it('refuses a quote to a site with no waste', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await quoteCleanUp(ana, sixWorkersTo(1, 3))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NotAWasteSite' })
    })

    it('refuses a quote to a site whose waste has not grown back yet', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(12)
      await sendCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(30)

      const response = await quoteCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NoWasteYet' })
    })

    it('refuses a quote for a team larger than the hires at home', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(5)

      const response = await quoteCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughHiresAtHome',
        params: { hire: 'worker', count: 6, atHome: 5 },
      })
    })

    it('answers a quote given hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await quoteCleanUp(ana, { ...sixWorkersTo(1, 12), hours: 2 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('answers a clean-up given hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await sendCleanUp(ana, { ...sixWorkersTo(1, 12), hours: 2 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent sends', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(12)
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const send = (site: number): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/clean-ups', jsonRequest('POST', ana, sixWorkersTo(1, site))),
        )

      const first = send(12)
      await firstHasRead.promise
      const second = send(9).then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([statuses, overview.job?.site.site]).toEqual([[200, 409], 12])
    })
  })

  describe('the food of the homes', () => {
    const setMoneyAndMaterialAside = (): Promise<void> =>
      runSql('UPDATE towns SET money = 100000, material = 100000')

    const raiseHomesThreeTimes = async (cookie: string): Promise<TownOverview> => {
      await startWork(cookie, 'homes')
      await startWork(cookie, 'homes')
      return overviewOf(await startWork(cookie, 'homes'))
    }

    it('lets a new town pay homes level 2 at once', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await startWork(ana, 'homes')

      expect(response.status).toBe(200)
      expect(amountsOf(await overviewOf(response))).toEqual({
        money: 310,
        food: 240,
        power: 200,
        material: 380,
      })
    })

    it('pays homes levels 2 to 4 from the starting food and leaves 15', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await setMoneyAndMaterialAside()

      const overview = await raiseHomesThreeTimes(ana)

      expect([overview.work.waitingList.at(-1)?.level, overview.stocks.food.amount]).toEqual([
        4, 15,
      ])
    })

    it('refuses homes level 5 with no farm, 187 food short', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await setMoneyAndMaterialAside()
      await raiseHomesThreeTimes(ana)

      const response = await startWork(ana, 'homes')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughResources',
        params: { missing: { money: 0, food: 187, power: 0, material: 0 } },
      })
    })

    it('keeps the stored cost of work charged before the food column and refunds it at a stop', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'homes')
      await startWork(ana, 'homes')
      await runSql('UPDATE towns SET food = 300, work_cost_food = 0')
      await runSql('UPDATE town_waiting_work SET cost_food = 0')

      const { work } = await overviewOf(await readTown(ana))
      await stopWork(ana, 'homes', 3)
      const overview = await overviewOf(await stopWork(ana, 'homes', 2))

      expect([work.slot?.cost.food, work.waitingList[0]?.cost.food, amountsOf(overview)]).toEqual([
        0,
        0,
        { money: 400, food: 300, power: 200, material: 500 },
      ])
    })

    it.each([
      { terrain: 'river', area: 2 },
      { terrain: 'hills', area: 3 },
    ])(
      'reaches homes level 5 through a farm from a $terrain town left with 15 food',
      async ({ terrain, area }) => {
        const ana = await signUpWithTown('ana@example.com')
        await runSql(`UPDATE towns SET area = ${area}`)
        await startWork(ana, 'factory')
        await startWork(ana, 'homes')
        await startWork(ana, 'homes')
        clock.advanceMinutes(300)
        const afterHomesFour = await overviewOf(await startWork(ana, 'homes'))
        clock.advanceMinutes(180)
        const farm = await startWork(ana, 'farm')
        clock.advanceMinutes(24 * 60)

        const homesFive = await overviewOf(await startWork(ana, 'homes'))

        expect([
          afterHomesFour.terrain,
          afterHomesFour.stocks.food.amount,
          farm.status,
          homesFive.work.slot?.level,
        ]).toEqual([terrain, 15, 200, 5])
      },
    )
  })

  describe('the next step', () => {
    const startLesson = (cookie: string, lessonId: string): Promise<Response> =>
      Promise.resolve(app.request('/town/lessons', jsonRequest('POST', cookie, { lessonId })))

    const stopLesson = (cookie: string, lessonId: string): Promise<Response> =>
      Promise.resolve(
        app.request(`/town/lessons/${lessonId}`, { method: 'DELETE', headers: { cookie } }),
      )

    const lessonMinutes = 6

    it('sends a founded town to lesson 1', async () => {
      const cookie = await signUp('ana@example.com')

      const founded = await overviewOf(await foundTown(cookie, { name: 'Maple Falls' }))

      expect(founded.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
    })

    it('answers no next review before a card enters', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      expect((await overviewOf(await readTown(cookie))).nextDueAt).toBeNull()
    })

    it('reads the town of a running lesson that left the curriculum', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      const emptied = createApp({
        ...server,
        clock,
        lessons: { ...server.lessons, lessons: () => [] },
      })

      const read = await emptied.request('/town', { headers: { cookie } })

      expect((await overviewOf(read)).nextStep).toEqual({ kind: 'lessonRunning', producer: null })
    })

    it('names the farm in the answer to a lesson start', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const started = await overviewOf(await startLesson(cookie, 'lesson-1'))

      expect(started.nextStep).toEqual({ kind: 'lessonRunning', producer: 'farm' })
    })

    it('drops the farm in the answer to its start of work', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')

      const building = await overviewOf(await startWork(cookie, 'farm'))

      expect(building.nextStep).toEqual({ kind: 'lessonRunning', producer: null })
    })

    it('names the farm again in the answer to its stop of work', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      await startWork(cookie, 'farm')

      const stopped = await overviewOf(await stopWork(cookie, 'farm', 1))

      expect(stopped.nextStep).toEqual({ kind: 'lessonRunning', producer: 'farm' })
    })

    it('goes back to the lesson in the answer to a lesson stop', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')

      const stopped = await overviewOf(await stopLesson(cookie, 'lesson-1'))

      expect(stopped.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
    })

    it('answers the finished lesson as reviews, its words to read first', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      clock.advanceMinutes(lessonMinutes)

      const finished = await overviewOf(await readTown(cookie))

      expect(finished.nextStep).toEqual({ kind: 'reviews', count: 5, readFirst: ['lesson-1'] })
    })

    it('answers the next review once the due cards are answered', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      clock.advanceMinutes(lessonMinutes)
      await readTown(cookie)
      const firstReviewAt = clock.now().epochMilliseconds
      const reviews = ReviewsSchema.parse(
        await (await app.request('/reviews', { headers: { cookie } })).json(),
      )
      for (const review of reviews.due) {
        assert(review.mode === 'recognition')
        const [choice] = review.choices
        assert(choice !== undefined)
        await app.request(
          `/reviews/${review.wordId}/answer`,
          jsonRequest('POST', cookie, { answer: choice.choiceId }),
        )
      }

      const answered = await overviewOf(await readTown(cookie))

      assert(answered.nextDueAt !== null)
      expect(answered.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-2' })
      expect(Date.parse(answered.nextDueAt)).toBeGreaterThan(firstReviewAt)
    })
  })

  describe('the guidance', () => {
    const readCaughtUp = (cookie: string): Promise<Response> =>
      Promise.resolve(
        createApp({
          ...server,
          clock,
          lessons: { ...server.lessons, lessons: () => [] },
        }).request('/town', { headers: { cookie } }),
      )

    const markTipSeen = (cookie: string, tip: string): Promise<Response> =>
      Promise.resolve(app.request(`/town/tips/${tip}`, { method: 'POST', headers: { cookie } }))

    const dismissGuidance = (cookie: string): Promise<Response> =>
      Promise.resolve(
        app.request('/town/guidance/dismissal', { method: 'POST', headers: { cookie } }),
      )

    it('answers the next goal only when caught up', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const studying = await overviewOf(await readTown(cookie))
      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(studying.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
      expect(caughtUp.nextStep).toEqual({
        kind: 'caughtUp',
        goal: {
          position: 1,
          count: 9,
          building: 'farm',
          level: 1,
          state: 'pending',
          missing: { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 },
        },
      })
    })

    it('answers the goal underway while its level is being built', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startWork(cookie, 'farm')

      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(caughtUp.nextStep).toEqual({
        kind: 'caughtUp',
        goal: { position: 1, count: 9, building: 'farm', level: 1, state: 'underway' },
      })
    })

    it('dismisses the guidance', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const dismissal = await dismissGuidance(cookie)
      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(dismissal.status).toBe(204)
      expect(caughtUp.nextStep).toEqual({ kind: 'caughtUp', goal: null })
    })

    it('refuses to dismiss the guidance of a player with no town as TownNotFound', async () => {
      const cookie = await signUp('ana@example.com')

      const response = await dismissGuidance(cookie)

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })

    it('answers no tip while no concept matters', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      expect((await overviewOf(await readTown(cookie))).tip).toBeNull()
    })

    it('answers the tip of a concept that matters', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const started = await overviewOf(await startWork(cookie, 'farm'))

      expect(started.tip).toBe('waitingList')
    })

    it('marks a tip seen once', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startWork(cookie, 'farm')

      const statuses = [
        (await markTipSeen(cookie, 'waitingList')).status,
        (await markTipSeen(cookie, 'waitingList')).status,
      ]
      const read = await overviewOf(await readTown(cookie))

      expect(statuses).toEqual([204, 204])
      expect(read.tip).toBeNull()
    })

    it('answers an unknown tip with an empty 400', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const response = await markTipSeen(cookie, 'peasants')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })
  })

  describe('the news', () => {
    const readNews = (cookie: string): Promise<Response> =>
      Promise.resolve(app.request('/town/news', { headers: { cookie } }))

    const newsOf = async (response: Response): Promise<TownNewsFeed> => {
      expect(response.status).toBe(200)
      return TownNewsFeedSchema.parse(await response.json())
    }

    it('answers the news newest first, each with its kind, its params and its instant', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      clock.advanceMinutes(3)
      await readTown(ana)
      await startWork(ana, 'homes')
      clock.advanceMinutes(1)
      await stopWork(ana, 'homes', 2)

      const news = await newsOf(await readNews(ana))

      expect(news.items).toEqual([
        {
          kind: 'buildingWorkStopped',
          params: {
            building: 'homes',
            level: 2,
            refund: { money: 90, food: 60, power: 0, material: 120 },
          },
          occurredAt: '2026-11-05T08:04:00.000Z',
        },
        {
          kind: 'buildingWorkFinished',
          params: { building: 'farm', level: 1 },
          occurredAt: '2026-11-05T08:02:00.000Z',
        },
      ])
    })

    it('tells finished work that no read has applied yet', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      clock.advanceMinutes(3)

      const news = await newsOf(await readNews(ana))

      expect(news.items.map(({ kind }) => kind)).toEqual(['buildingWorkFinished'])
    })

    it('refuses a player with no town as TownNotFound', async () => {
      const ana = await signUp('ana@example.com')

      const response = await readNews(ana)

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })
  })
})

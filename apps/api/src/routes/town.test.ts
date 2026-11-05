import { fileURLToPath } from 'node:url'
import { ApiErrorSchema, PlayerSchema } from '@mygame/contracts'
import {
  type TownNewsFeed,
  TownNewsFeedSchema,
  type TownOverview,
  TownOverviewSchema,
} from '@mygame/contracts/town'
import { type Clock, Instant } from '@mygame/domain'
import type { TownRepository } from '@mygame/domain/town'
import { Client } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
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
  towns: TownRepository,
  afterRead: () => Promise<void>,
): TownRepository => {
  let hasRead = false
  return {
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
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, player_seen_hints, player_skills, earned_skills, band_starts, held_out_words, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
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
      body: JSON.stringify({ email, password: 'hierro-y-lana', fiefName: 'Valdehierro' }),
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

    it('offers each building’s next level with its cost, duration and people', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const { buildings } = await overviewOf(await readTown(ana))

      expect([buildings.homes, buildings.farm]).toEqual([
        {
          level: 1,
          nextLevel: {
            level: 2,
            cost: { money: 90, food: 0, power: 0, material: 120 },
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

    it('answers a building of the fief with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await startWork(ana, 'sawmill')

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
            refund: { money: 90, food: 0, power: 0, material: 120 },
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

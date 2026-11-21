import type { TownOverview } from '@mygame/contracts'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../../../app'
import type { ComposedServer } from '../../../../composeServer'
import { truncatePlayerTables } from '../../../../truncatePlayerTables.testSupport'
import {
  amountsOf,
  fillStocks,
  holdStableWords,
  jsonRequest,
  type MovableClock,
  movableClock,
  overviewOf,
  pausingFirstTransaction,
  refusalOf,
  runSql,
  signal,
  type TownApp,
  townRequests,
  townServer,
  untilPlayerBlockedOrRead,
} from '../../../infrastructure/http/townRoutes.testSupport'

describe('the town route', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: TownApp

  beforeAll(() => {
    server = townServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const { signUp, signUpWithTown, readTown, startWork, stopWork } = townRequests(() => app)

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
      await holdStableWords('ana@example.com', 30)
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

    it('refuses a fresh town raising a building to 3 with the stable words it lacks', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      await startWork(ana, 'farm')

      const response = await startWork(ana, 'farm')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughWords',
        params: { needed: 10, held: 0, standing: 'stable' },
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
      await holdStableWords('ana@example.com', 20)

      const overview = await raiseHomesThreeTimes(ana)

      expect([overview.work.waitingList.at(-1)?.level, overview.stocks.food.amount]).toEqual([
        4, 15,
      ])
    })

    it('refuses homes level 5 with no farm, 187 food short', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await setMoneyAndMaterialAside()
      await holdStableWords('ana@example.com', 30)
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
      await holdStableWords('ana@example.com', 10)
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
        await holdStableWords('ana@example.com', 30)
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
})

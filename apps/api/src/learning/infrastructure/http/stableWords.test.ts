import type { TownOverview } from '@mygame/contracts'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import {
  amountsOf,
  fillStocks,
  type MovableClock,
  movableClock,
  overviewOf,
  refusalOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
} from '#town/infrastructure/http/townRoutes.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

const holdStableWords = (email: string, count: number): Promise<void> =>
  runSql(
    `INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at) SELECT id, 'stable-' || n, 'review', 12, 5, '2026-11-01T08:00:00Z', 'good', '2026-11-01T07:00:00Z' FROM players, generate_series(1, ${count}) n WHERE email = '${email}'`,
  )

describe('the stable words on the town', () => {
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

  const { signUpWithTown, readTown, startWork, stopWork } = townRequests(() => app)

  describe('the read', () => {
    it('reads the stable words the player holds', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await holdStableWords('ana@example.com', 3)

      const { stableWordCount, retainedWordCount } = await overviewOf(await readTown(ana))

      expect([stableWordCount, retainedWordCount]).toEqual([3, 0])
    })

    it('a building whose need the town’s words meet needs no words', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql("UPDATE town_buildings SET level = 2 WHERE building = 'farm'")
      await holdStableWords('ana@example.com', 10)

      const { buildings } = await overviewOf(await readTown(ana))

      expect(buildings.farm.nextLevel?.wordsNeeded).toBeNull()
    })
  })

  describe('the start of work', () => {
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
  })

  describe('the food of the homes', () => {
    const setMoneyAndMaterialAside = (): Promise<void> =>
      runSql('UPDATE towns SET money = 100000, material = 100000')

    const raiseHomesThreeTimes = async (cookie: string): Promise<TownOverview> => {
      await startWork(cookie, 'homes')
      await startWork(cookie, 'homes')
      return overviewOf(await startWork(cookie, 'homes'))
    }

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

import { Client } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  amountsOf,
  type MovableClock,
  minutesToADayBeforeEpoch,
  minutesToSummer,
  minutesToWinter,
  movableClock,
  overviewOf,
  refusalOf,
  runSql,
  statementTextOf,
  type TownApp,
  townRequests,
  townServer,
} from './townRoutes.testSupport'

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

  const { signUp, signUpWithTown, readTown, startWork } = townRequests(() => app)

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

    it('answers summer’s build percent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      clock.advanceMinutes(minutesToSummer)

      const { season, buildings } = await overviewOf(await readTown(ana))

      expect([
        season?.kind,
        season?.durationPercent.build,
        buildings.farm.nextLevel?.durationSeconds,
      ]).toEqual(['summer', 75, 90])
    })

    it('answers summer’s food percent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      clock.advanceMinutes(minutesToSummer)

      const { season, stocks } = await overviewOf(await readTown(ana))

      expect([season?.kind, season?.productionPercent.food, stocks.food.ratePerHour]).toEqual([
        'summer',
        125,
        6.25,
      ])
    })

    it('answers winter’s study percent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      clock.advanceMinutes(minutesToWinter)

      const { season, lessons } = await overviewOf(await readTown(ana))

      expect([season?.kind, season?.durationPercent.study, lessons[0]?.durationSeconds]).toEqual([
        'winter',
        75,
        225,
      ])
    })

    it('answers the hire percent in force', async () => {
      const ana = await signUpWithTown('ana@example.com')
      clock.advanceMinutes(minutesToSummer - 1)

      const { season, hiring } = await overviewOf(await readTown(ana))

      expect([season?.kind, season?.durationPercent, hiring.terms.worker.secondsPerHire]).toEqual([
        'spring',
        { build: 100, study: 100, hire: 75, road: 100 },
        90,
      ])
    })

    it('answers no percents before the epoch', async () => {
      clock.advanceMinutes(minutesToADayBeforeEpoch)
      const ana = await signUpWithTown('ana@example.com')

      const { season, buildings } = await overviewOf(await readTown(ana))

      expect([season, buildings.farm.nextLevel?.durationSeconds]).toEqual([null, 120])
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
            wordsNeeded: null,
          },
        },
        {
          level: 0,
          nextLevel: {
            level: 1,
            cost: { money: 50, food: 0, power: 0, material: 70 },
            durationSeconds: 120,
            people: 1,
            wordsNeeded: null,
          },
        },
      ])
    })

    it('a fresh town reads 0 stable and 0 retained words', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const { stableWordCount, retainedWordCount } = await overviewOf(await readTown(ana))

      expect([stableWordCount, retainedWordCount]).toEqual([0, 0])
    })

    it('a building at level 1 needs no words for level 2', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const { buildings } = await overviewOf(await readTown(ana))

      expect([buildings.homes.level, buildings.homes.nextLevel?.wordsNeeded]).toEqual([1, null])
    })

    it('a building at level 2 needs 10 stable words', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql("UPDATE town_buildings SET level = 2 WHERE building = 'farm'")

      const { buildings } = await overviewOf(await readTown(ana))

      expect(buildings.farm.nextLevel?.wordsNeeded).toEqual({ count: 10, standing: 'stable' })
    })

    it('a building at level 6 needs 50 retained words', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql("UPDATE town_buildings SET level = 6 WHERE building = 'farm'")

      const { buildings } = await overviewOf(await readTown(ana))

      expect(buildings.farm.nextLevel?.wordsNeeded).toEqual({ count: 50, standing: 'retained' })
    })

    it('needs the words of the level after the queued work', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql("UPDATE town_buildings SET level = 1 WHERE building = 'farm'")
      await startWork(ana, 'farm')

      const { buildings } = await overviewOf(await readTown(ana))

      expect(buildings.farm.nextLevel?.wordsNeeded).toEqual({ count: 10, standing: 'stable' })
    })

    it('a building at its top level has no next level', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await runSql("UPDATE town_buildings SET level = 10 WHERE building = 'farm'")

      const { buildings } = await overviewOf(await readTown(ana))

      expect(buildings.farm.nextLevel).toBeNull()
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

  describe('the holdout on the town', () => {
    it('says no band has started for a player who started none', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const overview = await overviewOf(await readTown(cookie))

      expect(overview.hasBandStarted).toBe(false)
    })

    it('answers no band line for a player who started no band', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const overview = await overviewOf(await readTown(cookie))

      expect(overview.bandLines).toEqual([])
    })
  })
})

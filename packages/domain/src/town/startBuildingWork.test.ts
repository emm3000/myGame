import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownLevels, plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { BuildingKind } from './BuildingKind'
import type { BuildingLevel } from './BuildingLevel'
import { startBuildingWork } from './startBuildingWork'
import type { TownCatalog } from './TownCatalog'

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR,
  )

const storedAt = hoursAfterEpoch(1)

const now = hoursAfterEpoch(2)

const frozenClock: Clock = { now: () => now }

const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

const pricedLevels: ReadonlyArray<BuildingLevel> = plainTownLevels.map((line) => ({
  ...line,
  cost: { money: 50 * line.level, food: 20, power: 0, material: 100 },
}))

const pricedCatalog = townCatalogOf(plainTownSettings, pricedLevels)

const startingStocks = { money: 400, food: 300, power: 200, material: 500 }

const startIn = async (
  shape: Omit<TownShape, 'storedAt'>,
  buildings: ReadonlyArray<BuildingKind>,
  catalog: TownCatalog = pricedCatalog,
): Promise<ReturnType<typeof startBuildingWork>> => {
  const towns = inMemoryTowns([townOf({ stocks: startingStocks, storedAt, ...shape })])
  const dependencies = { towns, news: inMemoryTownNews(), catalog, clock: frozenClock }
  const last = buildings.at(-1)
  for (const building of buildings.slice(0, -1)) {
    const started = await startBuildingWork({ playerId: 'player-1', building }, dependencies)
    assert(started.ok)
  }
  assert(last !== undefined)
  return startBuildingWork({ playerId: 'player-1', building: last }, dependencies)
}

describe('startBuildingWork', () => {
  it('starts work in the idle slot', async () => {
    const started = await startIn({}, ['farm'])

    assert(started.ok)
    expect(started.value.workSlot).toEqual({
      kind: 'busy',
      building: 'farm',
      level: 1,
      cost: { money: 50, food: 20, power: 0, material: 100 },
      startedAt: now,
      finishesAt: secondsAfter(now, 60),
    })
  })

  it('charges the cost at the enqueue', async () => {
    const started = await startIn({}, ['farm'])

    assert(started.ok)
    expect([started.value.stocks, started.value.storedAt]).toEqual([
      { money: 362, food: 285, power: 200, material: 400 },
      now,
    ])
  })

  it("queues behind a busy slot up to the content's cap", async () => {
    const started = await startIn({}, ['farm', 'farm', 'factory'])

    assert(started.ok)
    expect(started.value.waitingList).toEqual([
      {
        building: 'farm',
        level: 2,
        cost: { money: 100, food: 20, power: 0, material: 100 },
        durationSeconds: 120,
      },
      {
        building: 'factory',
        level: 1,
        cost: { money: 50, food: 20, power: 0, material: 100 },
        durationSeconds: 60,
      },
    ])
  })

  it('refuses work past the cap', async () => {
    const refused = await startIn({}, ['farm', 'farm', 'factory', 'powerStation'])

    expect(refused).toEqual({ ok: false, error: { kind: 'WaitingListFull', cap: 2 } })
  })

  it("fixes the duration with the season's build percent at the enqueue", async () => {
    const quickSpring = townCatalogOf(
      {
        ...plainTownSettings,
        seasons: {
          ...plainTownSettings.seasons,
          durationPercent: { ...plainTownSettings.seasons.durationPercent, spring: { build: 75 } },
        },
      },
      pricedLevels,
    )

    const started = await startIn({}, ['farm'], quickSpring)

    assert(started.ok && started.value.workSlot.kind === 'busy')
    expect(started.value.workSlot.finishesAt).toEqual(secondsAfter(now, 45))
  })

  it('refuses work whose people would pass the free people', async () => {
    const crowdedFactory = townCatalogOf(
      plainTownSettings,
      pricedLevels.map((line) =>
        line.building === 'factory' && line.level === 1 ? { ...line, people: 40 } : line,
      ),
    )

    const refused = await startIn({}, ['factory'], crowdedFactory)

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeople', requiredPeople: 40, freePeople: 26 },
    })
  })

  it('refuses work above the top level of the content', async () => {
    const refused = await startIn({ buildingLevels: { homes: 2 } }, ['homes'])

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'TopLevelReached', building: 'homes', level: 2 },
    })
  })

  it('refuses work the stocks cannot pay', async () => {
    const refused = await startIn({ stocks: { money: 0, food: 0, power: 0, material: 0 } }, [
      'farm',
    ])

    expect(refused).toEqual({
      ok: false,
      error: {
        kind: 'NotEnoughResources',
        missing: { money: 38, food: 15, power: 0, material: 100 },
      },
    })
  })

  it('refuses a player who holds no town', async () => {
    const refused = await startBuildingWork(
      { playerId: 'stranger', building: 'farm' },
      {
        towns: inMemoryTowns([]),
        news: inMemoryTownNews(),
        catalog: pricedCatalog,
        clock: frozenClock,
      },
    )

    expect(refused).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'stranger' } })
  })
})

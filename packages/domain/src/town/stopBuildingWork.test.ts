import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { WaitingWork, WorkSlot } from './BuildingWork'
import { stopBuildingWork } from './stopBuildingWork'

const MILLISECONDS_PER_MINUTE = 60_000

const minutesAfterEpoch = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE,
  )

const storedAt = minutesAfterEpoch(60)

const farmCost = { money: 50, food: 20, power: 0, material: 100 }

const busyFarm = (finishesAt: Instant): WorkSlot => ({
  kind: 'busy',
  building: 'farm',
  level: 1,
  cost: farmCost,
  startedAt: storedAt,
  finishesAt,
})

const waitingFactory: WaitingWork = {
  building: 'factory',
  level: 1,
  cost: { money: 30, food: 0, power: 10, material: 60 },
  durationSeconds: 600,
}

const waitingStorage: WaitingWork = {
  building: 'storage',
  level: 1,
  cost: { money: 70, food: 0, power: 0, material: 40 },
  durationSeconds: 900,
}

const startingStocks = { money: 400, food: 300, power: 200, material: 500 }

const busyTown = (finishesAt: Instant): ReturnType<typeof townOf> =>
  townOf({
    stocks: startingStocks,
    storedAt,
    workSlot: busyFarm(finishesAt),
    waitingList: [waitingFactory, waitingStorage],
  })

const waitingFarmTwo: WaitingWork = {
  building: 'farm',
  level: 2,
  cost: { money: 90, food: 40, power: 0, material: 150 },
  durationSeconds: 1200,
}

const farmChainTown = (): ReturnType<typeof townOf> =>
  townOf({
    stocks: startingStocks,
    storedAt,
    workSlot: busyFarm(minutesAfterEpoch(120)),
    waitingList: [waitingFarmTwo, waitingFactory],
  })

const busyHomes: WorkSlot = {
  kind: 'busy',
  building: 'homes',
  level: 2,
  cost: { money: 80, food: 0, power: 0, material: 120 },
  startedAt: storedAt,
  finishesAt: minutesAfterEpoch(120),
}

const waitingOffice = (level: number): WaitingWork => ({
  building: 'office',
  level,
  cost: { money: 100 * level, food: 0, power: 0, material: 50 * level },
  durationSeconds: 300 * level,
})

const crowdedTown: TownShape = {
  stocks: startingStocks,
  storedAt,
  buildingLevels: { factory: 2, farm: 2 },
  workSlot: busyHomes,
  waitingList: [waitingOffice(1), waitingOffice(2)],
}

const dependenciesAt = (
  now: Instant,
  town: ReturnType<typeof townOf>,
  catalog: ReturnType<typeof townCatalogOf> = townCatalogOf(),
): Parameters<typeof stopBuildingWork>[1] & {
  readonly news: ReturnType<typeof inMemoryTownNews>
  readonly towns: ReturnType<typeof inMemoryTowns>
} => {
  const frozenClock: Clock = { now: () => now }
  return {
    towns: inMemoryTowns([town]),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock,
  }
}

describe('stopBuildingWork', () => {
  it('refunds the full cost at a stop', async () => {
    const dependencies = dependenciesAt(minutesAfterEpoch(90), busyTown(minutesAfterEpoch(120)))

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'farm', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect(stopped.value.town.stocks).toEqual({ money: 456, food: 322, power: 200, material: 600 })
  })

  it('starts the next waiting work at the stop of the work in the slot', async () => {
    const now = minutesAfterEpoch(90)
    const dependencies = dependenciesAt(now, busyTown(minutesAfterEpoch(120)))

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'farm', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect([stopped.value.town.workSlot, stopped.value.town.waitingList]).toEqual([
      {
        kind: 'busy',
        building: 'factory',
        level: 1,
        cost: waitingFactory.cost,
        startedAt: now,
        finishesAt: minutesAfterEpoch(100),
      },
      [waitingStorage],
    ])
  })

  it('keeps the work ahead of a stopped waiting entry and the work behind it that still fits', async () => {
    const dependencies = dependenciesAt(minutesAfterEpoch(90), busyTown(minutesAfterEpoch(120)))

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'factory', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect([stopped.value.town.workSlot, stopped.value.town.waitingList]).toEqual([
      busyFarm(minutesAfterEpoch(120)),
      [waitingStorage],
    ])
  })

  it('stops in cascade the waiting work whose level below it was stopped', async () => {
    const now = minutesAfterEpoch(90)
    const dependencies = dependenciesAt(now, farmChainTown())

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'farm', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect([stopped.value.town.workSlot, stopped.value.town.waitingList]).toEqual([
      expect.objectContaining({ kind: 'busy', building: 'factory', level: 1, startedAt: now }),
      [],
    ])
  })

  it('refunds and records each entry stopped in cascade', async () => {
    const now = minutesAfterEpoch(90)
    const dependencies = dependenciesAt(now, farmChainTown())

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'farm', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect([stopped.value.town.stocks, dependencies.news.recordedEventsOf('town-1')]).toEqual([
      { money: 546, food: 362, power: 200, material: 750 },
      [
        {
          kind: 'buildingWorkStopped',
          building: 'farm',
          level: 1,
          refund: farmCost,
          occurredAt: now,
        },
        {
          kind: 'buildingWorkStopped',
          building: 'farm',
          level: 2,
          refund: waitingFarmTwo.cost,
          occurredAt: now,
        },
      ],
    ])
  })

  it('keeps waiting work whose level below it still waits ahead of it', async () => {
    const waitingFactoryTwo: WaitingWork = { ...waitingFactory, level: 2, durationSeconds: 1200 }
    const town = townOf({
      stocks: startingStocks,
      storedAt,
      workSlot: busyFarm(minutesAfterEpoch(120)),
      waitingList: [waitingFactory, waitingFactoryTwo],
    })
    const dependencies = dependenciesAt(minutesAfterEpoch(90), town)

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'farm', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect(stopped.value.town.waitingList).toEqual([waitingFactoryTwo])
  })

  it('stops a waiting entry in the middle of the list and the later work that needed it', async () => {
    const waitingFactoryTwo: WaitingWork = { ...waitingFactory, level: 2, durationSeconds: 1200 }
    const town = townOf({
      stocks: startingStocks,
      storedAt,
      workSlot: busyFarm(minutesAfterEpoch(120)),
      waitingList: [waitingStorage, waitingFactory, waitingFactoryTwo],
    })
    const dependencies = dependenciesAt(minutesAfterEpoch(90), town)

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'factory', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect([stopped.value.town.workSlot, stopped.value.town.waitingList]).toEqual([
      busyFarm(minutesAfterEpoch(120)),
      [waitingStorage],
    ])
  })

  it('keeps the stored duration of waiting work it starts in a season that scales builds', async () => {
    const now = minutesAfterEpoch(90)
    const halfBuilds = { build: 50, study: 100 }
    const fastBuilds = townCatalogOf({
      ...plainTownSettings,
      seasons: {
        ...plainTownSettings.seasons,
        durationPercent: {
          spring: halfBuilds,
          summer: halfBuilds,
          fall: halfBuilds,
          winter: halfBuilds,
        },
      },
    })
    const dependencies = dependenciesAt(now, busyTown(minutesAfterEpoch(120)), fastBuilds)

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'farm', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect(stopped.value.town.workSlot).toMatchObject({
      building: 'factory',
      startedAt: now,
      finishesAt: minutesAfterEpoch(100),
    })
  })

  it('stops in cascade the waiting work the free people no longer staff', async () => {
    const now = minutesAfterEpoch(90)
    const fewPeople = townCatalogOf({ ...plainTownSettings, basePeople: 0 })
    const dependencies = dependenciesAt(now, townOf(crowdedTown), fewPeople)

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'homes', level: 2 },
      dependencies,
    )

    assert(stopped.ok)
    expect([stopped.value.town.workSlot, stopped.value.town.waitingList]).toEqual([
      expect.objectContaining({ kind: 'busy', building: 'office', level: 1, startedAt: now }),
      [],
    ])
  })

  it('writes the finished and stopped events in the applying change', async () => {
    const finishedAt = minutesAfterEpoch(70)
    const now = minutesAfterEpoch(75)
    const dependencies = dependenciesAt(now, busyTown(finishedAt))

    const stopped = await stopBuildingWork(
      { playerId: 'player-1', building: 'factory', level: 1 },
      dependencies,
    )

    assert(stopped.ok)
    expect(dependencies.news.recordedEventsOf('town-1')).toEqual([
      { kind: 'buildingWorkFinished', building: 'farm', level: 1, occurredAt: finishedAt },
      {
        kind: 'buildingWorkStopped',
        building: 'factory',
        level: 1,
        refund: waitingFactory.cost,
        occurredAt: now,
      },
    ])
  })

  it('refuses a stop of work the town does not hold', async () => {
    const dependencies = dependenciesAt(minutesAfterEpoch(90), busyTown(minutesAfterEpoch(120)))

    const refused = await stopBuildingWork(
      { playerId: 'player-1', building: 'office', level: 1 },
      dependencies,
    )

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'BuildingWorkNotFound', building: 'office', level: 1 },
    })
  })
})

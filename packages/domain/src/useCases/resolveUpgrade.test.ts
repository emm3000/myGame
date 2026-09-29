import { assert, describe, expect, it } from 'vitest'
import type { BuildQueueEntry } from '../fief/BuildQueue'
import type { BusySlot } from '../fief/BuildSlot'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type Stocks, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type { OpenRecruitOrder } from '../fief/RecruitOrder'
import type { BusyStudySlot } from '../fief/StudySlot'
import type { AwayMarch } from '../march/March'
import type {
  ArtLevel,
  BuildingCatalog,
  BuildingLevel,
  FiefSettings,
  ProducerLevel,
  WarehouseLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err } from '../Result'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { refusingChronicle } from '../testing/refusingChronicle'
import { Instant } from '../time/Instant'
import { enqueueBuilding } from './enqueueBuilding'
import { resolveUpgrade } from './resolveUpgrade'
import { startStudy } from './startStudy'

const MILLISECONDS_PER_HOUR = 3_600_000

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const hoursAfterStored = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  units: plainUnits,
  forage: plainForage,
  seasons: neutralSeasons,
}

const sawmillCost: Stocks = { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 }

const sawmillLevel = (level: number, ratePerHour: number): ProducerLevel => ({
  building: 'sawmill',
  level,
  cost: sawmillCost,
  durationSeconds: 90,
  peasantOccupancy: level,
  ratePerHour,
})

const warehouseLevelOne: WarehouseLevel = {
  building: 'warehouse',
  level: 1,
  cost: { wood: 100, stone: 50, iron: 0, gold: 0, food: 0 },
  durationSeconds: 300,
  peasantOccupancy: 1,
  capacityUnits: 2000,
}

const inMemoryCatalog = (levels: ReadonlyArray<BuildingLevel>): BuildingCatalog => ({
  levelOf: (building, level) =>
    levels.find((known) => known.building === building && known.level === level),
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
})

const catalog = inMemoryCatalog([sawmillLevel(1, 30), sawmillLevel(2, 60), warehouseLevelOne])

const unchangedPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const springDoublingWoodFrom = (epoch: Instant): BuildingCatalog => ({
  ...catalog,
  fiefSettings: () => ({
    ...fiefSettings,
    seasons: {
      epoch,
      daysPerSeason: 7,
      multiplierPercent: {
        spring: { ...unchangedPercents, wood: 200 },
        summer: unchangedPercents,
        autumn: unchangedPercents,
        winter: unchangedPercents,
      },
      durationPercent: neutralSeasons.durationPercent,
    },
  }),
})

const smithingCost: Stocks = { wood: 40, stone: 0, iron: 30, gold: 20, food: 0 }

const doublingSmithing: ArtLevel = {
  art: 'smithing',
  level: 1,
  cost: smithingCost,
  durationSeconds: 3_600,
  requiredLibraryLevel: 1,
  resource: 'iron',
  ratePercent: 100,
}

const studyingCatalog: BuildingCatalog = {
  ...catalog,
  artLevelOf: (art, level) => (art === 'smithing' && level === 1 ? doublingSmithing : undefined),
}

const smithingStudyFinishingAfterHours = (hours: number): BusyStudySlot => ({
  kind: 'busy',
  art: 'smithing',
  targetLevel: 1,
  startedAt: storedInstant,
  finishesAt: hoursAfterStored(hours),
  cost: smithingCost,
})

const unbuiltLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 0,
  barracks: 0,
}

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: storedInstant,
    buildingLevels: unbuiltLevels,
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

const SECONDS_PER_HOUR = 3_600

const sawmillFinishingAfterHours = (hours: number): BusySlot => ({
  kind: 'busy',
  building: 'sawmill',
  targetLevel: 1,
  startedAt: storedInstant,
  cost: sawmillCost,
  finishesAt: hoursAfterStored(hours),
})

const waitingEntry = (
  building: 'sawmill' | 'warehouse',
  targetLevel: number,
  hours: number,
): BuildQueueEntry => ({
  building,
  targetLevel,
  cost: building === 'sawmill' ? sawmillCost : warehouseLevelOne.cost,
  durationSeconds: hours * SECONDS_PER_HOUR,
})

describe('resolveUpgrade', () => {
  it('applies the upgrade whose finish instant has passed', async () => {
    const sawmillBuildingFief = storedFief({
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([sawmillBuildingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.buildingLevels).toEqual({ ...unbuiltLevels, sawmill: 1 })
    expect(stored?.slot).toEqual({ kind: 'idle' })
  })

  it('resolves an upgrade whose finish instant is exactly now', async () => {
    const sawmillFinishingFief = storedFief({
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([sawmillFinishingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(result.value.fief.buildingLevels.sawmill).toBe(1)
    expect(result.value.fief.slot).toEqual({ kind: 'idle' })
  })

  it('accrues at the old rate up to the finish and at the new rate after it', async () => {
    const sawmillUpgradingFief = storedFief({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 2,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([sawmillUpgradingFief])
    const now = hoursAfterStored(2)

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(now) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks).toEqual({
      wood: 210,
      stone: 120,
      iron: 130,
      gold: 104,
      food: 120,
    })
    expect(result.value.fief.storedAt).toBe(now)
    expect(fiefs.storedFiefOf('lord')).toBe(result.value.fief)
  })

  it('applies a finish that comes before a season change at the old season rates', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(1) })])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: springDoublingWoodFrom(hoursAfterStored(2)),
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(230)
  })

  it('applies a finish that comes after a season change at the new season rates', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(2) })])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: springDoublingWoodFrom(hoursAfterStored(1)),
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(210)
  })

  it('accrues every resource on a fief with no building', async () => {
    const firstSawmillFief = storedFief({
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([firstSawmillFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks).toEqual({
      wood: 110,
      stone: 110,
      iron: 115,
      gold: 102,
      food: 110,
    })
  })

  it('leaves a slot still building untouched', async () => {
    const sawmillBuildingFief = storedFief({
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(2),
      },
    })
    const fiefs = inMemoryFiefRepository([sawmillBuildingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: sawmillBuildingFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('lord')).toBe(sawmillBuildingFief)
  })

  it('caps the amounts at the capacity the new warehouse level sets', async () => {
    const warehouseBuildingFief = storedFief({
      stocks: { wood: 900, stone: 100, iron: 100, gold: 100, food: 100 },
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      slot: {
        kind: 'busy',
        building: 'warehouse',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: warehouseLevelOne.cost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([warehouseBuildingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(100)) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(2000)
  })

  it('keeps a stock above the capacity through a finished upgrade', async () => {
    const overfilledFief = storedFief({
      stocks: { wood: 1200, stone: 100, iron: 100, gold: 100, food: 100 },
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([overfilledFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(1200)
  })

  it('applies every upgrade whose finish has passed, in order', async () => {
    const queuedFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      buildQueue: [waitingEntry('sawmill', 2, 1), waitingEntry('warehouse', 1, 1)],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(5)) },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.buildingLevels).toEqual({ ...unbuiltLevels, sawmill: 2, warehouse: 1 })
    expect(stored?.slot).toEqual({ kind: 'idle' })
    expect(stored?.buildQueue).toEqual([])
  })

  it('starts the next waiting upgrade at the instant the one before finished', async () => {
    const queuedFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      buildQueue: [waitingEntry('sawmill', 2, 2)],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    assert(result.ok)
    expect(result.value.fief.slot).toEqual({
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 2,
      startedAt: hoursAfterStored(1),
      finishesAt: hoursAfterStored(3),
      cost: sawmillCost,
    })
    expect(result.value.fief.buildQueue).toEqual([])
  })

  it('accrues each step at the rates the levels before it set', async () => {
    const queuedFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      buildQueue: [waitingEntry('sawmill', 2, 1)],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(3)) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks).toEqual({
      wood: 220,
      stone: 130,
      iron: 145,
      gold: 106,
      food: 130,
    })
  })

  it('stops at the first upgrade still building and keeps it in the slot', async () => {
    const warehouseEntry = waitingEntry('warehouse', 1, 1)
    const queuedFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      buildQueue: [waitingEntry('sawmill', 2, 2), warehouseEntry],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])
    const now = hoursAfterStored(2)

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(now) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.buildingLevels).toEqual({ ...unbuiltLevels, sawmill: 1 })
    expect(stored?.slot).toMatchObject({ building: 'sawmill', finishesAt: hoursAfterStored(3) })
    expect(stored?.buildQueue).toEqual([warehouseEntry])
    expect(stored?.storedAt).toBe(now)
  })

  it('raises the capacity for the steps after a finished warehouse', async () => {
    const queuedFief = storedFief({
      stocks: { wood: 900, stone: 100, iron: 100, gold: 100, food: 100 },
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      slot: {
        kind: 'busy',
        building: 'warehouse',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: warehouseLevelOne.cost,
        finishesAt: hoursAfterStored(1),
      },
      buildQueue: [waitingEntry('sawmill', 2, 10)],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(12)) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(1410)
  })

  it('starts the first waiting upgrade behind an idle slot at the stored instant', async () => {
    const warehouseEntry = waitingEntry('warehouse', 1, 1)
    const stalledFief = storedFief({
      buildQueue: [waitingEntry('sawmill', 1, 2), warehouseEntry],
    })
    const fiefs = inMemoryFiefRepository([stalledFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual({
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: hoursAfterStored(2),
      cost: sawmillCost,
    })
    expect(stored?.buildQueue).toEqual([warehouseEntry])
  })

  it('refunds a waiting level whose lower level was cancelled instead of building it', async () => {
    const orphanedFief = storedFief({
      buildQueue: [waitingEntry('sawmill', 2, 1), waitingEntry('warehouse', 1, 2)],
    })
    const fiefs = inMemoryFiefRepository([orphanedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toMatchObject({ building: 'warehouse', startedAt: storedInstant })
    expect(stored?.buildQueue).toEqual([])
    expect(stored?.buildingLevels.sawmill).toBe(0)
    expect(stored?.stocks.wood).toBe(170)
  })

  it('refunds a waiting upgrade the free peasants can no longer staff', async () => {
    const handHungryCatalog = inMemoryCatalog([
      sawmillLevel(1, 30),
      { ...warehouseLevelOne, peasantOccupancy: 5 },
    ])
    const understaffedFief = storedFief({
      buildQueue: [waitingEntry('warehouse', 1, 1), waitingEntry('sawmill', 1, 2)],
    })
    const fiefs = inMemoryFiefRepository([understaffedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: handHungryCatalog,
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toMatchObject({ building: 'sawmill', startedAt: storedInstant })
    expect(stored?.buildQueue).toEqual([])
    expect(stored?.stocks.wood).toBe(210)
  })

  it('refunds every waiting upgrade of a fief whose built levels occupy more peasants than they supply', async () => {
    const overcrowdingCatalog = inMemoryCatalog([
      { ...sawmillLevel(2, 60), peasantOccupancy: 9 },
      warehouseLevelOne,
    ])
    const overcrowdedFief = storedFief({
      buildingLevels: { ...unbuiltLevels, sawmill: 2 },
      buildQueue: [waitingEntry('warehouse', 1, 1)],
    })
    const fiefs = inMemoryFiefRepository([overcrowdedFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: overcrowdingCatalog,
        clock: frozenClock(storedInstant),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual({ kind: 'idle' })
    expect(stored?.buildQueue).toEqual([])
    expect(stored?.stocks).toEqual({ wood: 200, stone: 150, iron: 100, gold: 100, food: 100 })
  })

  it('keeps a waiting level whose lower level also waits when the queue restarts', async () => {
    const sawmillLevelTwo = waitingEntry('sawmill', 2, 1)
    const stalledFief = storedFief({
      buildQueue: [waitingEntry('sawmill', 1, 2), sawmillLevelTwo],
    })
    const fiefs = inMemoryFiefRepository([stalledFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toMatchObject({ building: 'sawmill', targetLevel: 1 })
    expect(stored?.buildQueue).toEqual([sawmillLevelTwo])
  })

  it('keeps a waiting level whose lower level waits behind another building', async () => {
    const quarryLevelOne: ProducerLevel = {
      building: 'quarry',
      level: 1,
      cost: sawmillCost,
      durationSeconds: 90,
      peasantOccupancy: 1,
      ratePerHour: 30,
    }
    const threeLevelCatalog = inMemoryCatalog([
      sawmillLevel(1, 30),
      sawmillLevel(2, 60),
      sawmillLevel(3, 90),
      quarryLevelOne,
    ])
    const quarryEntry: BuildQueueEntry = {
      building: 'quarry',
      targetLevel: 1,
      cost: sawmillCost,
      durationSeconds: SECONDS_PER_HOUR,
    }
    const sawmillLevelThree = waitingEntry('sawmill', 3, 1)
    const stalledFief = storedFief({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      buildQueue: [waitingEntry('sawmill', 2, 1), quarryEntry, sawmillLevelThree],
    })
    const fiefs = inMemoryFiefRepository([stalledFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: threeLevelCatalog,
        clock: frozenClock(hoursAfterStored(0.5)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toMatchObject({ building: 'sawmill', targetLevel: 2 })
    expect(stored?.buildQueue).toEqual([quarryEntry, sawmillLevelThree])
  })

  it('resumes a waiting upgrade on a read whose instant is earlier than the stored one', async () => {
    const waitingFief = storedFief({ buildQueue: [waitingEntry('sawmill', 1, 2)] })
    const fiefs = inMemoryFiefRepository([waitingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(-1)) },
    )

    assert(result.ok)
    expect(result.value.fief.storedAt).toBe(storedInstant)
    expect(result.value.fief.slot).toMatchObject({ building: 'sawmill', startedAt: storedInstant })
  })

  it('reports no change to persist for an idle slot', async () => {
    const idleFief = storedFief({})
    const fiefs = inMemoryFiefRepository([idleFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(5)) },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: idleFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('lord')).toBe(idleFief)
  })

  it('refuses a player who holds no fief', async () => {
    const result = await resolveUpgrade(
      { playerId: 'landless' },
      {
        fiefs: inMemoryFiefRepository([]),
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(storedInstant),
      },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', playerId: 'landless' } })
  })

  it('reports a finished level the catalog does not know', async () => {
    const unknownLevelFief = storedFief({
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 3,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const fiefs = inMemoryFiefRepository([unknownLevelFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 3 },
    })
    expect(fiefs.storedFiefOf('lord')).toBe(unknownLevelFief)
  })

  it('reports a save the repository refuses', async () => {
    const sawmillBuildingFief = storedFief({
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        cost: sawmillCost,
        finishesAt: hoursAfterStored(1),
      },
    })
    const refusingFiefs: FiefRepository = {
      ...inMemoryFiefRepository([sawmillBuildingFief]),
      save: async (fief) => err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates }),
    }

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs: refusingFiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'CoordinatesTaken', coordinates: sawmillBuildingFief.coordinates },
    })
  })

  it('raises the art when its study has finished by the read', async () => {
    const studyingFief = storedFief({ studySlot: smithingStudyFinishingAfterHours(1) })
    const fiefs = inMemoryFiefRepository([studyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.artLevels).toEqual({ smithing: 1, masonry: 0 })
    expect(stored?.studySlot).toEqual({ kind: 'idle' })
  })

  it('accrues iron at the smithing rate only after the study finishes', async () => {
    const studyingFief = storedFief({ studySlot: smithingStudyFinishingAfterHours(1) })
    const fiefs = inMemoryFiefRepository([studyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.iron).toBe(175)
  })

  it('applies an upgrade that finishes before a study at the rates in force before each', async () => {
    const buildingAndStudyingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(2),
    })
    const fiefs = inMemoryFiefRepository([buildingAndStudyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.stocks).toEqual({
      wood: 190,
      stone: 130,
      iron: 160,
      gold: 106,
      food: 130,
    })
  })

  it('applies an upgrade and a study that finish at one instant', async () => {
    const buildingAndStudyingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(1),
    })
    const fiefs = inMemoryFiefRepository([buildingAndStudyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    const { buildingLevels, artLevels, slot, studySlot, stocks } = result.value.fief
    expect({ buildingLevels, artLevels, slot, studySlot, stocks }).toEqual({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      artLevels: { smithing: 1, masonry: 0 },
      slot: { kind: 'idle' },
      studySlot: { kind: 'idle' },
      stocks: { wood: 150, stone: 120, iron: 145, gold: 104, food: 120 },
    })
  })

  it('leaves a study still running untouched', async () => {
    const studyingFief = storedFief({ studySlot: smithingStudyFinishingAfterHours(2) })
    const fiefs = inMemoryFiefRepository([studyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: studyingFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('lord')).toBe(studyingFief)
  })

  it('answers a finished upgrade at the instant it finished', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(1) })])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(3)) },
    )

    assert(result.ok)
    expect(result.value.events).toEqual([
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 1,
        occurredAt: hoursAfterStored(1),
      },
    ])
  })

  it('answers the finishes in the order they applied', async () => {
    const buildingAndStudyingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      buildQueue: [waitingEntry('sawmill', 2, 1)],
      studySlot: smithingStudyFinishingAfterHours(1.5),
    })
    const fiefs = inMemoryFiefRepository([buildingAndStudyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.events).toEqual([
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 1,
        occurredAt: hoursAfterStored(1),
      },
      { kind: 'artLearned', art: 'smithing', level: 1, occurredAt: hoursAfterStored(1.5) },
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 2,
        occurredAt: hoursAfterStored(2),
      },
    ])
  })

  it('answers the upgrade before the study that finishes at the same instant', async () => {
    const buildingAndStudyingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(1),
    })
    const fiefs = inMemoryFiefRepository([buildingAndStudyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.events.map((event) => event.kind)).toEqual([
      'upgradeFinished',
      'artLearned',
    ])
  })

  it('answers an art learned at the level the study reached', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({ studySlot: smithingStudyFinishingAfterHours(1) }),
    ])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.events).toEqual([
      { kind: 'artLearned', art: 'smithing', level: 1, occurredAt: hoursAfterStored(1) },
    ])
  })

  it('answers no event for a read with nothing to resolve', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(2) })])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(result.value.events).toEqual([])
  })

  it('records the finishes it applied through the chronicle', async () => {
    const buildingAndStudyingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(1.5),
    })
    const fiefs = inMemoryFiefRepository([buildingAndStudyingFief])
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle, catalog: studyingCatalog, clock: frozenClock(hoursAfterStored(3)) },
    )

    assert(result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 1,
        occurredAt: hoursAfterStored(1),
      },
      { kind: 'artLearned', art: 'smithing', level: 1, occurredAt: hoursAfterStored(1.5) },
    ])
  })

  it('records nothing when the read has nothing to resolve', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(2) })])
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle, catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('reports a record the chronicle refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(1) })])
    const refusal = { kind: 'FiefNotFound', playerId: 'lord' } as const

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: refusingChronicle(refusal),
        catalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    expect(result).toEqual({ ok: false, error: refusal })
  })
})

const MILLISECONDS_PER_DAY = 86_400_000

const seasonEpoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterSeasonEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

const seasonalDurationsOver = (base: BuildingCatalog): BuildingCatalog => ({
  ...base,
  fiefSettings: () => ({
    ...fiefSettings,
    seasons: {
      ...neutralSeasons,
      epoch: seasonEpoch,
      durationPercent: {
        spring: { build: 100, study: 100, train: 100 },
        summer: { build: 75, study: 100, train: 100 },
        autumn: { build: 100, study: 100, train: 100 },
        winter: { build: 100, study: 75, train: 100 },
      },
    },
  }),
})

describe('resolveUpgrade across seasons', () => {
  it('keeps the summer duration of an entry that starts in autumn', async () => {
    const midSummer = daysAfterSeasonEpoch(10)
    const firstDayOfAutumn = daysAfterSeasonEpoch(15)
    const seasonalCatalog = seasonalDurationsOver(
      inMemoryCatalog([sawmillLevel(1, 30), { ...sawmillLevel(2, 60), durationSeconds: 307 }]),
    )
    const sawmillBuildingIntoAutumn = storedFief({
      storedAt: midSummer,
      slot: {
        ...sawmillFinishingAfterHours(1),
        startedAt: midSummer,
        finishesAt: firstDayOfAutumn,
      },
    })
    const fiefs = inMemoryFiefRepository([sawmillBuildingIntoAutumn])
    const enqueued = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midSummer) },
    )
    assert(enqueued.ok)

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: seasonalCatalog,
        clock: frozenClock(secondsAfter(firstDayOfAutumn, 10)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.slot).toMatchObject({
      kind: 'busy',
      targetLevel: 2,
      startedAt: firstDayOfAutumn,
      finishesAt: secondsAfter(firstDayOfAutumn, 231),
    })
  })

  it('keeps a study started in winter at its winter duration in spring', async () => {
    const lastMinutesOfWinter = secondsAfter(daysAfterSeasonEpoch(28), -100)
    const seasonalCatalog = seasonalDurationsOver({
      ...studyingCatalog,
      artLevelOf: (art, level) =>
        art === 'smithing' && level === 1
          ? { ...doublingSmithing, durationSeconds: 1000 }
          : undefined,
    })
    const fiefs = inMemoryFiefRepository([
      storedFief({
        storedAt: lastMinutesOfWinter,
        buildingLevels: { ...unbuiltLevels, library: 1, barracks: 0 },
      }),
    ])
    const started = await startStudy(
      { playerId: 'lord', art: 'smithing' },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(lastMinutesOfWinter) },
    )
    assert(started.ok)

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: seasonalCatalog,
        clock: frozenClock(daysAfterSeasonEpoch(28)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.studySlot).toMatchObject({
      kind: 'busy',
      startedAt: lastMinutesOfWinter,
      finishesAt: secondsAfter(lastMinutesOfWinter, 375),
    })
  })
})

const secondsAfterStored = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + seconds * 1_000)

const fiveInfantryAtSixtySeconds: OpenRecruitOrder = {
  kind: 'open',
  unit: 'infantry',
  count: 5,
  cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
  perUnitSeconds: 60,
  startedAt: storedInstant,
}

const orderEndingAfterHours = (hours: number): OpenRecruitOrder => ({
  ...fiveInfantryAtSixtySeconds,
  perUnitSeconds: (hours * SECONDS_PER_HOUR) / fiveInfantryAtSixtySeconds.count,
})

describe('resolveUpgrade with a recruit order', () => {
  it('closes the order at its last delivery on the read', async () => {
    const recruitingFief = storedFief({ recruitOrder: fiveInfantryAtSixtySeconds })
    const fiefs = inMemoryFiefRepository([recruitingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(secondsAfterStored(300)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.recruitOrder).toEqual({ kind: 'idle' })
    expect(stored?.units.countOf('infantry')).toBe(5)
  })

  it('records the units an order delivered when it closes', async () => {
    const recruitingFief = storedFief({ recruitOrder: fiveInfantryAtSixtySeconds })
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs: inMemoryFiefRepository([recruitingFief]),
        chronicle,
        catalog,
        clock: frozenClock(secondsAfterStored(300)),
      },
    )

    assert(result.ok)
    const delivered = { kind: 'recruitsDelivered', unit: 'infantry', count: 5 }
    expect(result.value.events).toMatchObject([delivered])
    expect(chronicle.recordedEventsOf('fief-1')).toMatchObject([delivered])
  })

  it('stamps the delivery event with the last delivery instant', async () => {
    const recruitingFief = storedFief({ recruitOrder: fiveInfantryAtSixtySeconds })

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs: inMemoryFiefRepository([recruitingFief]),
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.events.map(({ occurredAt }) => occurredAt)).toEqual([
      secondsAfterStored(300),
    ])
  })

  it('records no delivery event while the order delivers', async () => {
    const buildingAndRecruitingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      recruitOrder: orderEndingAfterHours(2),
    })

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs: inMemoryFiefRepository([buildingAndRecruitingFief]),
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(secondsAfterStored(5_400)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.recruitOrder).toEqual(orderEndingAfterHours(2))
    expect(result.value.events.map(({ kind }) => kind)).toEqual(['upgradeFinished'])
  })

  it('closes an order that ends before an upgrade finishes', async () => {
    const recruitingAndBuildingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      recruitOrder: fiveInfantryAtSixtySeconds,
    })
    const fiefs = inMemoryFiefRepository([recruitingAndBuildingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    assert(result.ok)
    const { buildingLevels, recruitOrder, stocks, storedAt } = result.value.fief
    expect({ buildingLevels, recruitOrder, stocks, storedAt }).toEqual({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      recruitOrder: { kind: 'idle' },
      stocks: { wood: 149, stone: 119, iron: 129, gold: 103, food: 119 },
      storedAt: hoursAfterStored(2),
    })
    expect(result.value.fief.units.countOf('infantry')).toBe(5)
  })

  it('applies an upgrade, a study and an order ending at one instant in that order', async () => {
    const buildingStudyingAndRecruitingFief = storedFief({
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(1),
      recruitOrder: orderEndingAfterHours(1),
    })
    const fiefs = inMemoryFiefRepository([buildingStudyingAndRecruitingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    const { buildingLevels, artLevels, recruitOrder, stocks } = result.value.fief
    expect({ buildingLevels, artLevels, recruitOrder, stocks }).toEqual({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      artLevels: { smithing: 1, masonry: 0 },
      recruitOrder: { kind: 'idle' },
      stocks: { wood: 150, stone: 120, iron: 145, gold: 104, food: 120 },
    })
    expect(result.value.fief.units.countOf('infantry')).toBe(5)
    expect(result.value.events.map(({ kind }) => kind)).toEqual([
      'upgradeFinished',
      'artLearned',
      'recruitsDelivered',
    ])
  })

  it('leaves an order still delivering untouched', async () => {
    const recruitingFief = storedFief({ recruitOrder: fiveInfantryAtSixtySeconds })
    const fiefs = inMemoryFiefRepository([recruitingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(secondsAfterStored(299)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: recruitingFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('lord')).toBe(recruitingFief)
    expect(result.value.fief.unitCountsAt(secondsAfterStored(299)).countOf('infantry')).toBe(4)
  })

  it('keeps the occupied peasants when the order closes', async () => {
    const staffedCatalog: BuildingCatalog = {
      ...catalog,
      fiefSettings: () => ({ ...fiefSettings, basePeasantSupply: 10 }),
    }
    const recruitingFief = storedFief({ recruitOrder: fiveInfantryAtSixtySeconds })
    const fiefs = inMemoryFiefRepository([recruitingFief])
    const occupiedOf = (fief: Fief): number | undefined => {
      const counts = derivePeasantCounts(
        fief.buildingLevels,
        fief.units,
        fief.recruitOrder,
        staffedCatalog,
      )
      return counts.ok ? counts.value.occupied : undefined
    }

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: staffedCatalog,
        clock: frozenClock(secondsAfterStored(300)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.recruitOrder).toEqual({ kind: 'idle' })
    expect(occupiedOf(result.value.fief)).toBe(5)
    expect(occupiedOf(recruitingFief)).toBe(5)
  })
})

const tenInfantryForTwoHoursDepartedAt = (departedAt: Instant): AwayMarch => ({
  kind: 'away',
  province: 2,
  plot: 5,
  infantry: 10,
  stayHours: 2,
  departedAt,
  oneWaySeconds: 840,
  loot: { wood: 200, stone: 200, iron: 0, gold: 0, food: 0 },
})

const marchingFief = (overrides: Partial<StoredFief>): Fief =>
  storedFief({
    address: { kingdom: 1, province: 1, plot: 1 },
    units: { infantry: 10 },
    march: tenInfantryForTwoHoursDepartedAt(storedInstant),
    ...overrides,
  })

describe('resolveUpgrade with a march', () => {
  it('brings the loot home at the return', async () => {
    const fiefs = inMemoryFiefRepository([marchingFief({})])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(secondsAfterStored(8_880)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const { march, stocks, storedAt } = result.value.fief
    expect({ march, stocks, storedAt }).toEqual({
      march: { kind: 'idle' },
      stocks: { wood: 324, stone: 324, iron: 112, gold: 104, food: 149 },
      storedAt: secondsAfterStored(8_880),
    })
    expect(fiefs.storedFiefOf('lord')?.march).toEqual({ kind: 'idle' })
  })

  it('adds the loot above the capacity where the stocks freeze', async () => {
    const returningAtStored = (): Fief =>
      marchingFief({
        stocks: { wood: 990, stone: 100, iron: 100, gold: 100, food: 100 },
        march: tenInfantryForTwoHoursDepartedAt(secondsAfterStored(-8_880)),
      })
    const readAt = async (at: Instant): Promise<number | undefined> => {
      const result = await resolveUpgrade(
        { playerId: 'lord' },
        {
          fiefs: inMemoryFiefRepository([returningAtStored()]),
          chronicle: inMemoryChronicle(),
          catalog,
          clock: frozenClock(at),
        },
      )
      return result.ok ? result.value.fief.stocks.wood : undefined
    }

    expect(await readAt(storedInstant)).toBe(1_190)
    expect(await readAt(hoursAfterStored(1))).toBe(1_190)
  })

  it('closes a march that returns before an upgrade finishes', async () => {
    const fiefs = inMemoryFiefRepository([marchingFief({ slot: sawmillFinishingAfterHours(3) })])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(4)) },
    )

    assert(result.ok)
    const { buildingLevels, march, stocks, storedAt } = result.value.fief
    expect({ buildingLevels, march, stocks, storedAt }).toEqual({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      march: { kind: 'idle' },
      stocks: { wood: 369, stone: 339, iron: 119, gold: 107, food: 179 },
      storedAt: hoursAfterStored(4),
    })
  })

  it('applies an upgrade, a study, an order and a march ending at one instant in that order', async () => {
    const busyEverywhereFief = storedFief({
      units: { infantry: 10 },
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(1),
      recruitOrder: orderEndingAfterHours(1),
      march: tenInfantryForTwoHoursDepartedAt(secondsAfterStored(-5_280)),
    })
    const fiefs = inMemoryFiefRepository([busyEverywhereFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog: studyingCatalog,
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    const { buildingLevels, artLevels, recruitOrder, march, stocks } = result.value.fief
    expect({ buildingLevels, artLevels, recruitOrder, march, stocks }).toEqual({
      buildingLevels: { ...unbuiltLevels, sawmill: 1 },
      artLevels: { smithing: 1, masonry: 0 },
      recruitOrder: { kind: 'idle' },
      march: { kind: 'idle' },
      stocks: { wood: 350, stone: 320, iron: 145, gold: 104, food: 120 },
    })
    expect(result.value.fief.units.countOf('infantry')).toBe(15)
    expect(result.value.events.map(({ kind }) => kind)).toEqual([
      'upgradeFinished',
      'artLearned',
      'recruitsDelivered',
    ])
  })

  it('leaves a march still away untouched', async () => {
    const awayFief = marchingFief({})
    const fiefs = inMemoryFiefRepository([awayFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(secondsAfterStored(8_879)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: awayFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('lord')).toBe(awayFief)
  })

  it('keeps the unit counts and the peasants when the march returns', async () => {
    const staffedCatalog: BuildingCatalog = {
      ...catalog,
      fiefSettings: () => ({ ...fiefSettings, basePeasantSupply: 20 }),
    }
    const awayFief = marchingFief({})
    const peasantsOf = (fief: Fief): ReturnType<typeof derivePeasantCounts> =>
      derivePeasantCounts(fief.buildingLevels, fief.units, fief.recruitOrder, staffedCatalog)
    const returned = secondsAfterStored(8_880)

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        fiefs: inMemoryFiefRepository([awayFief]),
        chronicle: inMemoryChronicle(),
        catalog: staffedCatalog,
        clock: frozenClock(returned),
      },
    )

    assert(result.ok)
    const home = result.value.fief
    expect(home.march).toEqual({ kind: 'idle' })
    expect(home.units.countOf('infantry')).toBe(10)
    expect(home.unitsAtHomeAt(returned).countOf('infantry')).toBe(10)
    expect(awayFief.unitsAtHomeAt(secondsAfterStored(8_879)).countOf('infantry')).toBe(0)
    expect(peasantsOf(home)).toEqual(peasantsOf(awayFief))
    expect(peasantsOf(home)).toMatchObject({ ok: true, value: { occupied: 10 } })
  })
})

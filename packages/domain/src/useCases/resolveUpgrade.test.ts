import { assert, describe, expect, it } from 'vitest'
import type { CampBattle } from '../camp/CampBattle'
import type { CampTier } from '../camp/CampTier'
import { campOf } from '../camp/campOf'
import type { BuildQueueEntry } from '../fief/BuildQueue'
import type { BusySlot } from '../fief/BuildSlot'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type MarchSeason, type Stocks, type StoredFief } from '../fief/Fief'
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
import type { CampRegistry } from '../ports/CampRegistry'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { refusingChronicle } from '../testing/refusingChronicle'
import { sequentialIds } from '../testing/sequentialIds'
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
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
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
    units: { infantry: 0, cavalry: 0, settler: 0 },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(now),
      },
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
    expect(fiefs.storedFiefOf('fief-1')).toBe(result.value.fief)
  })

  it('applies a finish that comes before a season change at the old season rates', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(1) })])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: springDoublingWoodFrom(hoursAfterStored(2)),
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(230)
  })

  it('applies a finish that comes after a season change at the new season rates', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(2) })])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: springDoublingWoodFrom(hoursAfterStored(1)),
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: sawmillBuildingFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('fief-1')).toBe(sawmillBuildingFief)
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(100)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(5)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(3)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(now),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(12)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: handHungryCatalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: overcrowdingCatalog,
        ids: sequentialIds(),
        clock: frozenClock(storedInstant),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: threeLevelCatalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(0.5)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.slot).toMatchObject({ building: 'sawmill', targetLevel: 2 })
    expect(stored?.buildQueue).toEqual([quarryEntry, sawmillLevelThree])
  })

  it('resumes a waiting upgrade on a read whose instant is earlier than the stored one', async () => {
    const waitingFief = storedFief({ buildQueue: [waitingEntry('sawmill', 1, 2)] })
    const fiefs = inMemoryFiefRepository([waitingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(-1)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.storedAt).toBe(storedInstant)
    expect(result.value.fief.slot).toMatchObject({ building: 'sawmill', startedAt: storedInstant })
  })

  it('reports no change to persist for an idle slot', async () => {
    const idleFief = storedFief({})
    const fiefs = inMemoryFiefRepository([idleFief])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(5)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: idleFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('fief-1')).toBe(idleFief)
  })

  it('resolves the fief it is given and no other', async () => {
    const sawmillFinishing = sawmillFinishingAfterHours(1)
    const lordFief = storedFief({ slot: sawmillFinishing })
    const rivalFief = storedFief({
      id: 'fief-2',
      playerId: 'rival',
      address: { kingdom: 1, province: 3, plot: 2 },
      slot: sawmillFinishing,
    })
    const fiefs = inMemoryFiefRepository([lordFief, rivalFief])

    const result = await resolveUpgrade(
      { playerId: 'rival', fiefId: 'fief-2' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.id).toBe('fief-2')
    expect(fiefs.storedFiefOf('fief-2')?.buildingLevels.sawmill).toBe(1)
    expect(fiefs.storedFiefOf('fief-1')).toBe(lordFief)
  })

  it('refuses a fief of another player', async () => {
    const rivalFief = storedFief({
      id: 'fief-2',
      playerId: 'rival',
      address: { kingdom: 1, province: 3, plot: 2 },
      slot: sawmillFinishingAfterHours(1),
    })
    const fiefs = inMemoryFiefRepository([rivalFief])
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-2' },
      {
        fiefs,
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', fiefId: 'fief-2' } })
    expect(fiefs.storedFiefOf('fief-2')).toBe(rivalFief)
    expect(chronicle.recordedEventsOf('fief-2')).toEqual([])
  })

  it('refuses an unknown fief', async () => {
    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'unknown-fief' },
      {
        fiefs: inMemoryFiefRepository([]),
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(storedInstant),
      },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', fiefId: 'unknown-fief' } })
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 3 },
    })
    expect(fiefs.storedFiefOf('fief-1')).toBe(unknownLevelFief)
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: refusingFiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.artLevels).toEqual({ smithing: 1, masonry: 0 })
    expect(stored?.studySlot).toEqual({ kind: 'idle' })
  })

  it('accrues iron at the smithing rate only after the study finishes', async () => {
    const studyingFief = storedFief({ studySlot: smithingStudyFinishingAfterHours(1) })
    const fiefs = inMemoryFiefRepository([studyingFief])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: studyingFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('fief-1')).toBe(studyingFief)
  })

  it('answers a finished upgrade at the instant it finished', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(1) })])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(3)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    assert(result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('reports a record the chronicle refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: sawmillFinishingAfterHours(1) })])
    const refusal = { kind: 'FiefNotFound', fiefId: 'fief-1' } as const

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: refusingChronicle(refusal),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
        spring: { build: 100, study: 100, train: 100, road: 100 },
        summer: { build: 75, study: 100, train: 100, road: 100 },
        autumn: { build: 100, study: 100, train: 100, road: 75 },
        winter: { build: 100, study: 75, train: 100, road: 100 },
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
      { playerId: 'lord', fiefId: 'fief-1', building: 'sawmill' },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midSummer) },
    )
    assert(enqueued.ok)

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: seasonalCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(lastMinutesOfWinter) },
    )
    assert(started.ok)

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: seasonalCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(secondsAfterStored(300)),
      },
    )

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.recruitOrder).toEqual({ kind: 'idle' })
    expect(stored?.units.countOf('infantry')).toBe(5)
  })

  it('records the units an order delivered when it closes', async () => {
    const recruitingFief = storedFief({ recruitOrder: fiveInfantryAtSixtySeconds })
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([recruitingFief]),
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([recruitingFief]),
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([buildingAndRecruitingFief]),
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(2)),
      },
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(secondsAfterStored(299)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: recruitingFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('fief-1')).toBe(recruitingFief)
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: staffedCatalog,
        ids: sequentialIds(),
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
  order: 'forage',
  province: 2,
  plot: 5,
  units: { infantry: 10, cavalry: 0, settler: 0 },
  stayHours: 2,
  departedAt,
  oneWaySeconds: 840,
  loot: { wood: 200, stone: 200, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
})

const marchingFief = (overrides: Partial<StoredFief>): Fief =>
  storedFief({
    address: { kingdom: 1, province: 1, plot: 1 },
    units: { infantry: 10, cavalry: 0, settler: 0 },
    march: tenInfantryForTwoHoursDepartedAt(storedInstant),
    ...overrides,
  })

describe('resolveUpgrade with a march', () => {
  it('brings the loot home at the return', async () => {
    const fiefs = inMemoryFiefRepository([marchingFief({})])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
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
    expect(fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('records the plot, the infantry and the loot when the march returns', async () => {
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([marchingFief({})]),
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 5,
      units: { infantry: 10, cavalry: 0, settler: 0 },
      loot: { wood: 200, stone: 200, iron: 0, gold: 0, food: 0 },
    }
    expect(result.value.events).toMatchObject([returned])
    expect(chronicle.recordedEventsOf('fief-1')).toMatchObject([returned])
  })

  it('stamps the return event with the return instant', async () => {
    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([marchingFief({})]),
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(3)),
      },
    )

    assert(result.ok)
    expect(result.value.events.map(({ occurredAt }) => occurredAt)).toEqual([
      secondsAfterStored(8_880),
    ])
  })

  it('records a recalled march as recalled at its return', async () => {
    const recalledFief = marchingFief({
      march: {
        ...tenInfantryForTwoHoursDepartedAt(storedInstant),
        recalledAt: secondsAfterStored(2_640),
        loot: { wood: 15, stone: 15, iron: 0, gold: 0, food: 0 },
      },
    })
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([recalledFief]),
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(secondsAfterStored(3_480)),
      },
    )

    assert(result.ok)
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 5,
      units: { infantry: 10, cavalry: 0, settler: 0 },
      loot: { wood: 15, stone: 15, iron: 0, gold: 0, food: 0 },
      recalled: true,
      occurredAt: secondsAfterStored(3_480),
    }
    expect(result.value.events).toEqual([returned])
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([returned])
  })

  it('records an unrecalled march as not recalled', async () => {
    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([marchingFief({})]),
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(secondsAfterStored(8_880)),
      },
    )

    assert(result.ok)
    expect(result.value.events).toMatchObject([{ kind: 'marchReturned', recalled: false }])
  })

  it('records no return event while the march is away', async () => {
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([marchingFief({ slot: sawmillFinishingAfterHours(1) })]),
        chronicle,
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(secondsAfterStored(8_879)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.march.kind).toBe('away')
    expect(chronicle.recordedEventsOf('fief-1').map(({ kind }) => kind)).toEqual([
      'upgradeFinished',
    ])
  })

  it('adds the loot above the capacity where the stocks freeze', async () => {
    const returningAtStored = (): Fief =>
      marchingFief({
        stocks: { wood: 990, stone: 100, iron: 100, gold: 100, food: 100 },
        march: tenInfantryForTwoHoursDepartedAt(secondsAfterStored(-8_880)),
      })
    const readAt = async (at: Instant): Promise<number | undefined> => {
      const result = await resolveUpgrade(
        { playerId: 'lord', fiefId: 'fief-1' },
        {
          fiefs: inMemoryFiefRepository([returningAtStored()]),
          chronicle: inMemoryChronicle(),
          camps: inMemoryCampRegistry([]),
          catalog,
          ids: sequentialIds(),
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(hoursAfterStored(4)),
      },
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
      units: { infantry: 10, cavalry: 0, settler: 0 },
      slot: sawmillFinishingAfterHours(1),
      studySlot: smithingStudyFinishingAfterHours(1),
      recruitOrder: orderEndingAfterHours(1),
      march: tenInfantryForTwoHoursDepartedAt(secondsAfterStored(-5_280)),
    })
    const fiefs = inMemoryFiefRepository([busyEverywhereFief])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: studyingCatalog,
        ids: sequentialIds(),
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
      'marchReturned',
    ])
  })

  it('leaves a march still away untouched', async () => {
    const awayFief = marchingFief({})
    const fiefs = inMemoryFiefRepository([awayFief])

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog,
        ids: sequentialIds(),
        clock: frozenClock(secondsAfterStored(8_879)),
      },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: awayFief, events: [], hasChanged: false })
    expect(fiefs.storedFiefOf('fief-1')).toBe(awayFief)
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
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs: inMemoryFiefRepository([awayFief]),
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: staffedCatalog,
        ids: sequentialIds(),
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

const campPlotOfProvinceTwo = (tier: CampTier): number => {
  const plot = Array.from({ length: 15 }, (_, index) => index + 1).find(
    (candidate) => campOf({ kingdom: 1, province: 2, plot: candidate }, plainCamps)?.tier === tier,
  )
  assert(plot !== undefined)
  return plot
}

const unscaledMarchSeason: MarchSeason = {
  roadPercent: 100,
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
}

const attackingFief = (tier: CampTier, strength: number): Fief => {
  const dispatched = storedFief({
    address: { kingdom: 1, province: 1, plot: 1 },
    units: { infantry: 10, cavalry: 0, settler: 0 },
  }).dispatchAttack(
    {
      province: 2,
      plot: campPlotOfProvinceTwo(tier),
      units: { infantry: 10, cavalry: 0, settler: 0 },
    },
    { tier, strength },
    storedInstant,
    fiefSettings,
    unscaledMarchSeason,
  )
  assert(dispatched.ok)
  return dispatched.value
}

const arrivalOf = (fief: Fief): Instant => {
  assert(fief.march.kind === 'away')
  return secondsAfterStored(fief.march.oneWaySeconds)
}

const resolveAttackAt = (
  attacking: Fief,
  now: Instant,
  camps: CampRegistry,
  catalogInForce: BuildingCatalog = catalog,
): ReturnType<typeof resolveUpgrade> =>
  resolveUpgrade(
    { playerId: 'lord', fiefId: 'fief-1' },
    {
      fiefs: inMemoryFiefRepository([attacking]),
      chronicle: inMemoryChronicle(),
      camps,
      catalog: catalogInForce,
      ids: sequentialIds(),
      clock: frozenClock(now),
    },
  )

const countingCamps = (): {
  readonly camps: CampRegistry
  readonly recorded: ReadonlyArray<CampBattle>
} => {
  const recorded: Array<CampBattle> = []
  const camps = inMemoryCampRegistry([])
  return {
    camps: {
      ...camps,
      record: (battle) => {
        recorded.push(battle)
        return camps.record(battle)
      },
    },
    recorded,
  }
}

describe('resolveUpgrade with an attack', () => {
  it('fights the battle at the arrival', async () => {
    const attacking = attackingFief(1, 6)
    const arrival = arrivalOf(attacking)

    const result = await resolveAttackAt(attacking, arrival, inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    expect(result.value.fief.march).toMatchObject({ kind: 'away', fought: true })
    expect(result.value.fief.storedAt).toEqual(arrival)
  })

  it('lowers the infantry by the lost', async () => {
    const attacking = attackingFief(1, 6)
    const arrival = arrivalOf(attacking)

    const result = await resolveAttackAt(attacking, arrival, inMemoryCampRegistry([]))

    assert(result.ok)
    const { fief } = result.value
    expect(fief.units.countOf('infantry')).toBe(6)
    expect(fief.march).toMatchObject({ units: { infantry: 6, cavalry: 0, settler: 0 } })
    expect(fief.unitsAtHomeAt(arrival).countOf('infantry')).toBe(0)
  })

  it('walks the survivors home with the loot', async () => {
    const attacking = attackingFief(1, 6)
    const returned = secondsAfterStored(2 * 600)

    const result = await resolveAttackAt(attacking, returned, inMemoryCampRegistry([]))

    assert(result.ok)
    const { fief } = result.value
    expect({ march: fief.march, stocks: fief.stocks, storedAt: fief.storedAt }).toEqual({
      march: { kind: 'idle' },
      stocks: { wood: 198, stone: 198, iron: 100, gold: 196, food: 106 },
      storedAt: returned,
    })
    expect(fief.unitsAtHomeAt(returned).countOf('infantry')).toBe(6)
  })

  it('idles the march slot when the battle is lost', async () => {
    const attacking = attackingFief(2, 15)

    const result = await resolveAttackAt(attacking, arrivalOf(attacking), inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.fief.march).toEqual({ kind: 'idle' })
    expect(result.value.fief.units.countOf('infantry')).toBe(0)
  })

  it('records the camp beaten to 0 at the arrival', async () => {
    const attacking = attackingFief(1, 6)
    const arrival = arrivalOf(attacking)
    const camps = inMemoryCampRegistry([])
    const address = { kingdom: 1, province: 2, plot: campPlotOfProvinceTwo(1) }

    await resolveAttackAt(attacking, secondsAfterStored(2 * 600), camps)

    expect(await camps.lastBattleOf(address)).toEqual({
      ...address,
      strength: 0,
      foughtAt: arrival,
    })
  })

  it('records the strength a defending camp keeps', async () => {
    const attacking = attackingFief(2, 15)
    const camps = inMemoryCampRegistry([])
    const address = { kingdom: 1, province: 2, plot: campPlotOfProvinceTwo(2) }

    await resolveAttackAt(attacking, arrivalOf(attacking), camps)

    expect(await camps.lastBattleOf(address)).toEqual({
      ...address,
      strength: 8,
      foughtAt: arrivalOf(attacking),
    })
  })

  it('fights nothing when the attack was recalled', async () => {
    const recalled = attackingFief(1, 6).recallMarch(
      { departedAt: storedInstant },
      secondsAfterStored(300),
      { forage: plainForage, units: plainUnits },
    )
    assert(recalled.ok)
    const { camps, recorded } = countingCamps()

    const result = await resolveAttackAt(recalled.value, secondsAfterStored(600), camps)

    assert(result.ok)
    expect(result.value.fief.march).toEqual({ kind: 'idle' })
    expect(result.value.fief.units.countOf('infantry')).toBe(10)
    expect(recorded).toEqual([])
  })

  it('frees the peasants of the dead', async () => {
    const staffedCatalog: BuildingCatalog = {
      ...catalog,
      fiefSettings: () => ({ ...fiefSettings, basePeasantSupply: 20 }),
    }
    const attacking = attackingFief(1, 6)
    const occupiedOf = (fief: Fief): number | undefined => {
      const peasants = derivePeasantCounts(
        fief.buildingLevels,
        fief.units,
        fief.recruitOrder,
        staffedCatalog,
      )
      return peasants.ok ? peasants.value.occupied : undefined
    }

    const result = await resolveAttackAt(
      attacking,
      arrivalOf(attacking),
      inMemoryCampRegistry([]),
      staffedCatalog,
    )

    assert(result.ok)
    expect(occupiedOf(attacking)).toBe(10)
    expect(occupiedOf(result.value.fief)).toBe(6)
  })

  it('applies an upgrade and a battle ending at one instant in that order', async () => {
    const attacking = attackingFief(1, 6)
    const arrival = arrivalOf(attacking)
    const upgrading = Fief.restore({
      id: attacking.id,
      playerId: attacking.playerId,
      name: 'Vado Viejo',
      address: { kingdom: 1, province: 1, plot: 1 },
      stocks: attacking.stocks,
      storedAt: attacking.storedAt,
      buildingLevels: unbuiltLevels,
      artLevels: { smithing: 0, masonry: 0 },
      units: { infantry: 10, cavalry: 0, settler: 0 },
      slot: { ...sawmillFinishingAfterHours(1), finishesAt: arrival },
      buildQueue: [],
      studySlot: { kind: 'idle' },
      recruitOrder: { kind: 'idle' },
      march: attacking.march,
    })
    assert(upgrading.ok)

    const result = await resolveAttackAt(upgrading.value, arrival, inMemoryCampRegistry([]))

    assert(result.ok)
    const { fief, events } = result.value
    expect(fief.buildingLevels.sawmill).toBe(1)
    expect(fief.units.countOf('infantry')).toBe(6)
    expect(fief.march).toMatchObject({
      fought: true,
      units: { infantry: 6, cavalry: 0, settler: 0 },
    })
    expect(events.map(({ kind, occurredAt }) => ({ kind, occurredAt }))).toEqual([
      { kind: 'upgradeFinished', occurredAt: arrival },
      { kind: 'battleFought', occurredAt: arrival },
    ])
  })

  it('records a won battle with the losses on each side', async () => {
    const attacking = attackingFief(1, 6)

    const result = await resolveAttackAt(attacking, arrivalOf(attacking), inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.events).toEqual([
      {
        kind: 'battleFought',
        province: 2,
        plot: campPlotOfProvinceTwo(1),
        tier: 1,
        won: true,
        unitsLost: { infantry: 4, cavalry: 0, settler: 0 },
        campLost: 6,
        occurredAt: arrivalOf(attacking),
      },
    ])
  })

  it('records a lost battle', async () => {
    const attacking = attackingFief(2, 15)

    const result = await resolveAttackAt(attacking, arrivalOf(attacking), inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.events).toEqual([
      {
        kind: 'battleFought',
        province: 2,
        plot: campPlotOfProvinceTwo(2),
        tier: 2,
        won: false,
        unitsLost: { infantry: 10, cavalry: 0, settler: 0 },
        campLost: 7,
        occurredAt: arrivalOf(attacking),
      },
    ])
  })

  it('stamps the battle with the arrival', async () => {
    const attacking = attackingFief(1, 6)
    const arrival = arrivalOf(attacking)

    const result = await resolveAttackAt(
      attacking,
      secondsAfterStored(900),
      inMemoryCampRegistry([]),
    )

    assert(result.ok)
    expect(result.value.events).toMatchObject([{ kind: 'battleFought', occurredAt: arrival }])
  })

  it('records the return of a won attack after its battle', async () => {
    const attacking = attackingFief(1, 6)
    const returned = secondsAfterStored(2 * 600)

    const result = await resolveAttackAt(attacking, returned, inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.events).toMatchObject([
      { kind: 'battleFought', won: true, occurredAt: arrivalOf(attacking) },
      {
        kind: 'marchReturned',
        units: { infantry: 6, cavalry: 0, settler: 0 },
        loot: { wood: 96, stone: 96, gold: 96 },
        recalled: false,
        occurredAt: returned,
      },
    ])
  })

  it('records no battle for a recalled attack', async () => {
    const recalled = attackingFief(1, 6).recallMarch(
      { departedAt: storedInstant },
      secondsAfterStored(300),
      { forage: plainForage, units: plainUnits },
    )
    assert(recalled.ok)

    const result = await resolveAttackAt(
      recalled.value,
      secondsAfterStored(600),
      inMemoryCampRegistry([]),
    )

    assert(result.ok)
    expect(result.value.events.map(({ kind }) => kind)).toEqual(['marchReturned'])
  })

  it('does not fight a battle twice', async () => {
    const attacking = attackingFief(1, 6)
    const arrival = arrivalOf(attacking)
    const fiefs = inMemoryFiefRepository([attacking])
    const { camps, recorded } = countingCamps()
    const readAt = (now: Instant): ReturnType<typeof resolveUpgrade> =>
      resolveUpgrade(
        { playerId: 'lord', fiefId: 'fief-1' },
        {
          fiefs,
          chronicle: inMemoryChronicle(),
          camps,
          catalog,
          clock: frozenClock(now),
          ids: sequentialIds(),
        },
      )

    await readAt(arrival)
    const second = await readAt(secondsAfterStored(900))

    assert(second.ok)
    expect(second.value.hasChanged).toBe(false)
    expect(fiefs.storedFiefOf('fief-1')?.units.countOf('infantry')).toBe(6)
    expect(fiefs.storedFiefOf('fief-1')?.march).toMatchObject({
      fought: true,
      units: { infantry: 6, cavalry: 0, settler: 0 },
    })
    expect(recorded).toHaveLength(1)
  })

  describe('during an open recruit order', () => {
    const thirtyInfantryAtSixtySeconds: OpenRecruitOrder = {
      kind: 'open',
      unit: 'infantry',
      count: 30,
      cost: { wood: 600, stone: 0, iron: 300, gold: 0, food: 900 },
      perUnitSeconds: 60,
      startedAt: secondsAfterStored(-600),
    }

    const attackingWithTheLevy = (): Fief => {
      const dispatched = storedFief({
        address: { kingdom: 1, province: 1, plot: 1 },
        recruitOrder: thirtyInfantryAtSixtySeconds,
      }).dispatchAttack(
        {
          province: 2,
          plot: campPlotOfProvinceTwo(1),
          units: { infantry: 10, cavalry: 0, settler: 0 },
        },
        { tier: 1, strength: 6 },
        storedInstant,
        fiefSettings,
        unscaledMarchSeason,
      )
      assert(dispatched.ok)
      return dispatched.value
    }

    it('keeps the stored count whole when a battle falls during an open order', async () => {
      const attacking = attackingWithTheLevy()
      const arrival = arrivalOf(attacking)

      const result = await resolveAttackAt(attacking, arrival, inMemoryCampRegistry([]))

      assert(result.ok)
      const { fief } = result.value
      expect(fief.units.countOf('infantry')).toBe(16)
      expect(fief.recruitOrder).toEqual({
        ...thirtyInfantryAtSixtySeconds,
        count: 10,
        cost: { wood: 200, stone: 0, iron: 100, gold: 0, food: 300 },
        startedAt: arrival,
      })
    })

    it('keeps the instants of the remaining deliveries', async () => {
      const attacking = attackingWithTheLevy()
      const counted = attacking.unitCountsAt(secondsAfterStored(659)).countOf('infantry')

      const result = await resolveAttackAt(
        attacking,
        arrivalOf(attacking),
        inMemoryCampRegistry([]),
      )

      assert(result.ok)
      const { fief } = result.value
      expect(counted).toBe(20)
      expect(fief.unitCountsAt(secondsAfterStored(659)).countOf('infantry')).toBe(16)
      expect(fief.unitCountsAt(secondsAfterStored(660)).countOf('infantry')).toBe(17)
      expect(fief.unitCountsAt(secondsAfterStored(1_200)).countOf('infantry')).toBe(26)
    })

    it('refunds exactly the undelivered units on a cancel after the battle', async () => {
      const attacking = attackingWithTheLevy()
      const arrival = arrivalOf(attacking)
      const cancelledAt = secondsAfterStored(690)

      const result = await resolveAttackAt(attacking, arrival, inMemoryCampRegistry([]))
      assert(result.ok)
      const cancelled = result.value.fief.cancelRecruitOrder(
        { unit: 'infantry', startedAt: arrival },
        result.value.fief.stocks,
        cancelledAt,
      )

      assert(cancelled.ok)
      expect(cancelled.value.events).toMatchObject([
        {
          kind: 'recruitsCancelled',
          delivered: 1,
          cancelled: 9,
          refund: { wood: 180, stone: 0, iron: 90, gold: 0, food: 270 },
        },
      ])
      expect(cancelled.value.fief.units.countOf('infantry')).toBe(17)
    })

    it('counts only the remainder on the levy line that closes the order', async () => {
      const attacking = attackingWithTheLevy()

      const result = await resolveAttackAt(
        attacking,
        secondsAfterStored(1_200),
        inMemoryCampRegistry([]),
      )

      assert(result.ok)
      expect(result.value.events).toMatchObject([
        { kind: 'battleFought', won: true },
        { kind: 'recruitsDelivered', unit: 'infantry', count: 10 },
        { kind: 'marchReturned', units: { infantry: 6, cavalry: 0, settler: 0 } },
      ])
      expect(result.value.fief.units.countOf('infantry')).toBe(26)
    })
  })
})

const mixedAttackingFief = (): Fief => {
  const dispatched = storedFief({
    address: { kingdom: 1, province: 3, plot: 12 },
    units: { infantry: 12, cavalry: 6, settler: 0 },
  }).dispatchAttack(
    { province: 2, plot: campPlotOfProvinceTwo(1), units: { infantry: 2, cavalry: 3, settler: 0 } },
    { tier: 1, strength: 6 },
    storedInstant,
    fiefSettings,
    unscaledMarchSeason,
  )
  assert(dispatched.ok)
  return dispatched.value
}

describe('resolveUpgrade with a party of several kinds', () => {
  it('takes the dead of each kind out of the count at the battle', async () => {
    const attacking = mixedAttackingFief()

    const result = await resolveAttackAt(attacking, arrivalOf(attacking), inMemoryCampRegistry([]))

    assert(result.ok)
    const { fief } = result.value
    expect([fief.units.countOf('infantry'), fief.units.countOf('cavalry')]).toEqual([10, 4])
    expect(fief.march).toMatchObject({
      fought: true,
      units: { infantry: 0, cavalry: 1, settler: 0 },
    })
  })

  it('records the losses of each kind in the battle event', async () => {
    const attacking = mixedAttackingFief()

    const result = await resolveAttackAt(attacking, arrivalOf(attacking), inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.events).toMatchObject([
      { kind: 'battleFought', won: true, unitsLost: { infantry: 2, cavalry: 2, settler: 0 } },
    ])
  })

  it('records each kind in the return event', async () => {
    const attacking = mixedAttackingFief()
    const returned = secondsAfterStored(2 * 1_260)

    const result = await resolveAttackAt(attacking, returned, inMemoryCampRegistry([]))

    assert(result.ok)
    expect(result.value.events).toMatchObject([
      { kind: 'battleFought' },
      {
        kind: 'marchReturned',
        units: { infantry: 0, cavalry: 1, settler: 0 },
        loot: { wood: 40, stone: 40, iron: 0, gold: 40, food: 0 },
        occurredAt: returned,
      },
    ])
  })
})

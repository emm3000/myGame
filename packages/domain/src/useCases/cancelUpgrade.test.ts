import { assert, describe, expect, it } from 'vitest'
import type { BuildQueueEntry } from '../fief/BuildQueue'
import type { BusySlot } from '../fief/BuildSlot'
import { Fief, type Stocks, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type {
  BuildingCatalog,
  BuildingKind,
  BuildingLevel,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
  WarehouseLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { Instant } from '../time/Instant'
import { cancelUpgrade } from './cancelUpgrade'

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
}

const sawmillCost: Stocks = { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 }

const sawmillLevel = (level: number): ProducerLevel => ({
  building: 'sawmill',
  level,
  cost: sawmillCost,
  durationSeconds: 7_200,
  peasantOccupancy: level,
  ratePerHour: 30 * level,
})

const quarryLevelOne: ProducerLevel = {
  building: 'quarry',
  level: 1,
  cost: { wood: 40, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 3_600,
  peasantOccupancy: 1,
  ratePerHour: 30,
}

const farmLevelOne: FarmLevel = {
  building: 'farm',
  level: 1,
  cost: { wood: 30, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 3_600,
  peasantOccupancy: 0,
  ratePerHour: 20,
  peasantSupply: 2,
}

const warehouseLevelOne: WarehouseLevel = {
  building: 'warehouse',
  level: 1,
  cost: { wood: 100, stone: 50, iron: 0, gold: 0, food: 0 },
  durationSeconds: 3_600,
  peasantOccupancy: 1,
  capacityUnits: 2000,
}

const knownLevels: ReadonlyArray<BuildingLevel> = [
  sawmillLevel(1),
  sawmillLevel(2),
  sawmillLevel(3),
  quarryLevelOne,
  farmLevelOne,
  warehouseLevelOne,
]

const catalog: BuildingCatalog = {
  levelOf: (building, level) =>
    knownLevels.find((known) => known.building === building && known.level === level),
  fiefSettings: () => fiefSettings,
}

const unbuiltLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
}

const sawmillInProgress: BusySlot = {
  kind: 'busy',
  building: 'sawmill',
  targetLevel: 1,
  startedAt: storedInstant,
  finishesAt: hoursAfterStored(2),
  cost: sawmillCost,
}

const warehouseInProgress: BusySlot = {
  kind: 'busy',
  building: 'warehouse',
  targetLevel: 1,
  startedAt: storedInstant,
  finishesAt: hoursAfterStored(1),
  cost: warehouseLevelOne.cost,
}

const waitingEntry = (
  building: BuildingKind,
  targetLevel: number,
  wood: number,
): BuildQueueEntry => ({
  building,
  targetLevel,
  cost: { wood, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 3_600,
})

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 40, stone: 85, iron: 100, gold: 100, food: 90 },
    storedAt: storedInstant,
    buildingLevels: unbuiltLevels,
    slot: sawmillInProgress,
    buildQueue: [],
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

describe('cancelUpgrade', () => {
  it('refunds the full cost the busy slot stored', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.stocks).toEqual({
      wood: 100,
      stone: 100,
      iron: 100,
      gold: 100,
      food: 100,
    })
  })

  it('adds the refund to the stocks materialized at the cancel instant', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.stocks).toEqual({
      wood: 110,
      stone: 110,
      iron: 115,
      gold: 102,
      food: 110,
    })
  })

  it('frees the slot and stamps the fief at the cancel instant', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const cancelInstant = hoursAfterStored(1)

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(cancelInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual({ kind: 'idle' })
    expect(stored?.storedAt).toBe(cancelInstant)
    expect(stored?.buildingLevels).toEqual(unbuiltLevels)
  })

  it('keeps a refund that exceeds the capacity', async () => {
    const nearlyFullFief = storedFief({
      stocks: { wood: 990, stone: 995, iron: 100, gold: 100, food: 1000 },
    })
    const fiefs = inMemoryFiefRepository([nearlyFullFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.stocks).toEqual({
      wood: 1050,
      stone: 1010,
      iron: 100,
      gold: 100,
      food: 1010,
    })
  })

  it('refunds a waiting entry and keeps the order of the ones after it', async () => {
    const sawmillLevelTwo = waitingEntry('sawmill', 2, 20)
    const farmEntry = waitingEntry('farm', 1, 30)
    const queuedFief = storedFief({
      buildQueue: [waitingEntry('warehouse', 1, 10), sawmillLevelTwo, farmEntry],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'warehouse', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual(sawmillInProgress)
    expect(stored?.buildQueue).toEqual([sawmillLevelTwo, farmEntry])
    expect(stored?.stocks.wood).toBe(50)
  })

  it('starts the next entry at the cancel instant when the one in progress is cancelled', async () => {
    const warehouseEntry = waitingEntry('warehouse', 1, 10)
    const queuedFief = storedFief({ buildQueue: [warehouseEntry] })
    const fiefs = inMemoryFiefRepository([queuedFief])
    const cancelInstant = hoursAfterStored(1)

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(cancelInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual({
      kind: 'busy',
      building: 'warehouse',
      targetLevel: 1,
      startedAt: cancelInstant,
      finishesAt: hoursAfterStored(2),
      cost: warehouseEntry.cost,
    })
    expect(stored?.buildQueue).toEqual([])
  })

  it('cancels in cascade a waiting level whose lower level was cancelled', async () => {
    const quarryEntry = waitingEntry('quarry', 1, 30)
    const queuedFief = storedFief({
      slot: warehouseInProgress,
      buildQueue: [waitingEntry('sawmill', 1, 10), quarryEntry, waitingEntry('sawmill', 2, 20)],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual(warehouseInProgress)
    expect(stored?.buildQueue).toEqual([quarryEntry])
  })

  it('cancels in cascade the waiting level above the upgrade in progress', async () => {
    const queuedFief = storedFief({ buildQueue: [waitingEntry('sawmill', 2, 20)] })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual({ kind: 'idle' })
    expect(stored?.buildQueue).toEqual([])
  })

  it('cancels in cascade an entry the free peasants cannot staff once a waiting farm is cancelled', async () => {
    const quarryEntry = waitingEntry('quarry', 1, 30)
    const queuedFief = storedFief({
      buildingLevels: { ...unbuiltLevels, sawmill: 3 },
      slot: warehouseInProgress,
      buildQueue: [waitingEntry('farm', 1, 10), quarryEntry],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'farm', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.buildQueue).toEqual([])
  })

  it('refunds every cascaded entry its full stored cost', async () => {
    const queuedFief = storedFief({
      slot: warehouseInProgress,
      buildQueue: [
        waitingEntry('sawmill', 1, 10),
        waitingEntry('sawmill', 2, 20),
        waitingEntry('sawmill', 3, 300),
      ],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.stocks.wood).toBe(370)
  })

  it('cancels the waiting level it names and keeps the lower one of the same building', async () => {
    const sawmillLevelOne = waitingEntry('sawmill', 1, 10)
    const queuedFief = storedFief({
      slot: warehouseInProgress,
      buildQueue: [sawmillLevelOne, waitingEntry('sawmill', 2, 20)],
    })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 2 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.buildQueue).toEqual([sawmillLevelOne])
  })

  it('refuses an entry that neither the slot nor the queue holds', async () => {
    const queuedFief = storedFief({ buildQueue: [waitingEntry('warehouse', 1, 10)] })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'farm', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UpgradeNotFound', building: 'farm', targetLevel: 1 },
    })
  })

  it('refuses the upgrade in progress while the slot is idle', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: { kind: 'idle' } })])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UpgradeNotFound', building: 'sawmill', targetLevel: 1 },
    })
  })

  it('refuses to cancel an upgrade that has already finished', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(sawmillInProgress.finishesAt) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UpgradeNotFound', building: 'sawmill', targetLevel: 1 },
    })
  })

  it('refuses a waiting entry once the upgrade in progress has finished', async () => {
    const queuedFief = storedFief({ buildQueue: [waitingEntry('warehouse', 1, 10)] })
    const fiefs = inMemoryFiefRepository([queuedFief])

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'warehouse', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(sawmillInProgress.finishesAt) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UpgradeNotFound', building: 'warehouse', targetLevel: 1 },
    })
  })

  it('writes nothing when it refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: { kind: 'idle' } })])
    const before = JSON.stringify(fiefs.storedFiefOf('lord'))

    const result = await cancelUpgrade(
      { playerId: 'lord', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(!result.ok)
    expect(JSON.stringify(fiefs.storedFiefOf('lord'))).toBe(before)
  })

  it('refuses a player who holds no fief', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await cancelUpgrade(
      { playerId: 'landless', building: 'sawmill', targetLevel: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', playerId: 'landless' } })
  })
})

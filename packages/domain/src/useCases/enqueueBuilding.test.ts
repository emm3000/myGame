import { assert, describe, expect, it } from 'vitest'
import { Fief, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type {
  BuildingCatalog,
  BuildingLevel,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { Instant } from '../time/Instant'
import { enqueueBuilding } from './enqueueBuilding'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const oneHourLater = Instant.fromEpochMilliseconds(86_400_000 + 3_600_000)

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
}

const sawmillLevel = (level: number, peasantOccupancy: number): ProducerLevel => ({
  building: 'sawmill',
  level,
  cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 },
  durationSeconds: 90,
  peasantOccupancy,
  ratePerHour: 30,
})

const quarryLevelOne: ProducerLevel = {
  building: 'quarry',
  level: 1,
  cost: { wood: 50, stone: 20, iron: 0, gold: 0, food: 0 },
  durationSeconds: 100,
  peasantOccupancy: 1,
  ratePerHour: 20,
}

const farmLevelOne: FarmLevel = {
  building: 'farm',
  level: 1,
  cost: { wood: 70, stone: 20, iron: 0, gold: 0, food: 0 },
  durationSeconds: 120,
  peasantOccupancy: 1,
  ratePerHour: 25,
  peasantSupply: 5,
}

const inMemoryCatalog = (levels: ReadonlyArray<BuildingLevel>): BuildingCatalog => ({
  levelOf: (building, level) =>
    levels.find((known) => known.building === building && known.level === level),
  fiefSettings: () => fiefSettings,
})

const twoLevelCatalog = inMemoryCatalog([
  sawmillLevel(1, 1),
  sawmillLevel(2, 2),
  quarryLevelOne,
  farmLevelOne,
])

const unbuiltLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
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
    slot: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

describe('enqueueBuilding', () => {
  it('starts the upgrade in a free slot', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.slot).toEqual({
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 1,
      finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 90_000),
    })
  })

  it('debits the cost from the amounts materialized at now', async () => {
    const quarryWorkingFief = storedFief({ buildingLevels: { ...unbuiltLevels, quarry: 1 } })
    const fiefs = inMemoryFiefRepository([quarryWorkingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.stocks).toEqual({ wood: 50, stone: 115, iron: 115, gold: 102, food: 100 })
    expect(stored?.storedAt).toBe(oneHourLater)
  })

  it('refuses a second upgrade while the slot is busy', async () => {
    const sawmillFinishing = Instant.fromEpochMilliseconds(86_400_000 + 90_000)
    const busyFief = storedFief({
      slot: { kind: 'busy', building: 'sawmill', targetLevel: 1, finishesAt: sawmillFinishing },
    })
    const fiefs = inMemoryFiefRepository([busyFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'quarry' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'SlotBusy', until: sawmillFinishing } })
  })

  it('refuses an upgrade the stocks cannot pay for', async () => {
    const poorFief = storedFief({ stocks: { wood: 20, stone: 100, iron: 0, gold: 0, food: 4 } })
    const fiefs = inMemoryFiefRepository([poorFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'InsufficientResources',
        missing: { wood: 40, stone: 0, iron: 0, gold: 0, food: 6 },
      },
    })
  })

  it('refuses an upgrade the free peasants cannot staff', async () => {
    const handHungryCatalog = inMemoryCatalog([sawmillLevel(1, 5), quarryLevelOne])
    const quarryWorkingFief = storedFief({ buildingLevels: { ...unbuiltLevels, quarry: 1 } })
    const fiefs = inMemoryFiefRepository([quarryWorkingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: handHungryCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeasants', requiredPeasants: 5, freePeasants: 3 },
    })
  })

  it('refuses a building the catalog does not know', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'warehouse' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'UnknownBuilding', building: 'warehouse' } })
  })

  it('refuses a level beyond the catalog cap', async () => {
    const cappedSawmillFief = storedFief({ buildingLevels: { ...unbuiltLevels, sawmill: 2 } })
    const fiefs = inMemoryFiefRepository([cappedSawmillFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'MaxLevelReached', building: 'sawmill', level: 2 },
    })
  })

  it('writes nothing when it refuses', async () => {
    const poorFief = storedFief({ stocks: { wood: 20, stone: 100, iron: 0, gold: 0, food: 4 } })
    const fiefs = inMemoryFiefRepository([poorFief])
    const before = JSON.stringify(fiefs.storedFiefOf('lord'))

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(oneHourLater) },
    )

    assert(!result.ok)
    expect(JSON.stringify(fiefs.storedFiefOf('lord'))).toBe(before)
  })

  it('refuses a player who holds no fief', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await enqueueBuilding(
      { playerId: 'landless', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', playerId: 'landless' } })
  })

  it('reports a stored fief the repository cannot restore', async () => {
    const corruptFiefs: FiefRepository = {
      ...inMemoryFiefRepository([]),
      fiefOf: async () => err({ kind: 'NegativeResourceAmount', amount: -1 }),
    }

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs: corruptFiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -1 } })
  })

  it('replaces the stored fief instead of adding a second one', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(fiefs.savedFiefs().map((saved) => saved.slot.kind)).toEqual(['busy'])
  })

  it('releases the current level occupancy when staffing the upgrade', async () => {
    const handHungryLevelTwoCatalog = inMemoryCatalog([
      sawmillLevel(1, 1),
      sawmillLevel(2, 3),
      quarryLevelOne,
    ])
    const workingFief = storedFief({ buildingLevels: { ...unbuiltLevels, sawmill: 1, quarry: 1 } })
    const fiefs = inMemoryFiefRepository([workingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: handHungryLevelTwoCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(result.value.slot).toMatchObject({ kind: 'busy', building: 'sawmill', targetLevel: 2 })
  })
})

import { assert, describe, expect, it } from 'vitest'
import { Fief, type Stocks, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type {
  BuildingCatalog,
  BuildingLevel,
  FiefSettings,
  ProducerLevel,
  WarehouseLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { Instant } from '../time/Instant'
import { resolveUpgrade } from './resolveUpgrade'

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
  fiefSettings: () => fiefSettings,
})

const catalog = inMemoryCatalog([sawmillLevel(1, 30), sawmillLevel(2, 60), warehouseLevelOne])

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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(2)) },
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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(1)) },
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
      { fiefs, catalog, clock: frozenClock(now) },
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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(1)) },
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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: sawmillBuildingFief, hasChanged: false })
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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(100)) },
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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    assert(result.ok)
    expect(result.value.fief.stocks.wood).toBe(1200)
  })

  it('reports no change to persist for an idle slot', async () => {
    const idleFief = storedFief({})
    const fiefs = inMemoryFiefRepository([idleFief])

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(5)) },
    )

    assert(result.ok)
    expect(result.value).toEqual({ fief: idleFief, hasChanged: false })
    expect(fiefs.storedFiefOf('lord')).toBe(idleFief)
  })

  it('refuses a player who holds no fief', async () => {
    const result = await resolveUpgrade(
      { playerId: 'landless' },
      { fiefs: inMemoryFiefRepository([]), catalog, clock: frozenClock(storedInstant) },
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
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(2)) },
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
      { fiefs: refusingFiefs, catalog, clock: frozenClock(hoursAfterStored(2)) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'CoordinatesTaken', coordinates: sawmillBuildingFief.coordinates },
    })
  })
})

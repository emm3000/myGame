import { assert, describe, expect, it } from 'vitest'
import type { BusySlot } from '../fief/BuildSlot'
import { Fief, type Stocks, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type { BuildingCatalog, FiefSettings, ProducerLevel } from '../ports/BuildingCatalog'
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
}

const sawmillCost: Stocks = { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 }

const sawmillLevelOne: ProducerLevel = {
  building: 'sawmill',
  level: 1,
  cost: sawmillCost,
  durationSeconds: 7_200,
  peasantOccupancy: 1,
  ratePerHour: 30,
}

const catalog: BuildingCatalog = {
  levelOf: (building, level) =>
    building === 'sawmill' && level === 1 ? sawmillLevelOne : undefined,
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
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

describe('cancelUpgrade', () => {
  it('refunds the full cost the busy slot stored', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelUpgrade(
      { playerId: 'lord' },
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
      { playerId: 'lord' },
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
      { playerId: 'lord' },
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
      { playerId: 'lord' },
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

  it('refuses to cancel with the slot idle', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: { kind: 'idle' } })])

    const result = await cancelUpgrade(
      { playerId: 'lord' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'SlotIdle' } })
  })

  it('refuses to cancel an upgrade that has already finished', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelUpgrade(
      { playerId: 'lord' },
      { fiefs, catalog, clock: frozenClock(sawmillInProgress.finishesAt) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'SlotIdle' } })
  })

  it('writes nothing when it refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ slot: { kind: 'idle' } })])
    const before = JSON.stringify(fiefs.storedFiefOf('lord'))

    const result = await cancelUpgrade(
      { playerId: 'lord' },
      { fiefs, catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(!result.ok)
    expect(JSON.stringify(fiefs.storedFiefOf('lord'))).toBe(before)
  })

  it('refuses a player who holds no fief', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await cancelUpgrade(
      { playerId: 'landless' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', playerId: 'landless' } })
  })
})

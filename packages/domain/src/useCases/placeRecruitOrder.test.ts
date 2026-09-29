import { assert, describe, expect, it } from 'vitest'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type {
  BarracksLevel,
  BuildingCatalog,
  FarmLevel,
  FiefSettings,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { placeRecruitOrder } from './placeRecruitOrder'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const oneHourLater = Instant.fromEpochMilliseconds(86_400_000 + 3_600_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  units: plainUnits,
  seasons: neutralSeasons,
}

const barracksLevel = (level: number): BarracksLevel => ({
  building: 'barracks',
  level,
  cost: { wood: 150, stone: 100, iron: 30, gold: 0, food: 0 },
  durationSeconds: 400,
  peasantOccupancy: level,
})

const farmLevel = (level: number): FarmLevel => ({
  building: 'farm',
  level,
  cost: { wood: 40, stone: 10, iron: 0, gold: 0, food: 0 },
  durationSeconds: 120,
  peasantOccupancy: 1,
  ratePerHour: 10 * level,
  peasantSupply: 4 * level,
})

const catalog: BuildingCatalog = {
  levelOf: (building, level) => {
    if (level < 1 || level > 3) {
      return undefined
    }
    if (building === 'barracks') {
      return barracksLevel(level)
    }
    return building === 'farm' ? farmLevel(level) : undefined
  },
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const levelsWithBarracks = (barracks: number): FiefBuildingLevels => ({
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 0,
  barracks,
})

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 500, stone: 100, iron: 300, gold: 100, food: 500 },
    storedAt: storedInstant,
    buildingLevels: levelsWithBarracks(1),
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

describe('placeRecruitOrder', () => {
  it('opens an order for N infantry in the idle recruit slot', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 3 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.recruitOrder).toEqual({
      kind: 'open',
      unit: 'infantry',
      count: 3,
      cost: { wood: 60, stone: 0, iron: 30, gold: 0, food: 90 },
      perUnitSeconds: 45,
      startedAt: storedInstant,
    })
  })

  it('debits N times the unit cost at the order', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 4 },
      { fiefs, catalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.stocks).toEqual({ wood: 430, stone: 110, iron: 275, gold: 102, food: 390 })
    expect(stored?.storedAt).toBe(oneHourLater)
    expect(stored?.recruitOrder).toMatchObject({
      cost: { wood: 80, stone: 0, iron: 40, gold: 0, food: 120 },
    })
  })

  it('divides the unit duration by one plus the barracks level with one rounding', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ buildingLevels: levelsWithBarracks(2) })])
    const hundredSecondInfantry: BuildingCatalog = {
      ...catalog,
      fiefSettings: () => ({
        ...fiefSettings,
        units: { infantry: { ...plainUnits.infantry, durationSeconds: 100 } },
      }),
    }

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 1 },
      { fiefs, catalog: hundredSecondInfantry, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.recruitOrder).toMatchObject({ perUnitSeconds: 34 })
  })

  it('charges the peasants of every unit ordered at once', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 3 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const { buildingLevels, units, recruitOrder } = result.value
    expect(derivePeasantCounts(buildingLevels, units, recruitOrder, catalog)).toEqual({
      ok: true,
      value: { supplied: 6, occupied: 4, free: 2 },
    })
  })

  it('refuses an order without a barracks', async () => {
    const unarmed = storedFief({ buildingLevels: levelsWithBarracks(0) })
    const fiefs = inMemoryFiefRepository([unarmed])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'BarracksNotBuilt' }))
    expect(fiefs.storedFiefOf('lord')).toBe(unarmed)
  })

  it('refuses an order while another is open', async () => {
    const recruiting = storedFief({
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 1,
        cost: plainUnits.infantry.cost,
        perUnitSeconds: 45,
        startedAt: storedInstant,
      },
    })
    const fiefs = inMemoryFiefRepository([recruiting])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'RecruitSlotBusy', unit: 'infantry' }))
    expect(fiefs.storedFiefOf('lord')).toBe(recruiting)
  })

  it('refuses an order the stocks cannot pay', async () => {
    const hungry = storedFief({ stocks: { wood: 500, stone: 100, iron: 300, gold: 100, food: 50 } })
    const fiefs = inMemoryFiefRepository([hungry])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 2 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(
      err({
        kind: 'InsufficientResources',
        missing: { wood: 0, stone: 0, iron: 0, gold: 0, food: 10 },
      }),
    )
    expect(fiefs.storedFiefOf('lord')).toBe(hungry)
  })

  it('refuses an order the free peasants cannot staff', async () => {
    const fief = storedFief({})
    const fiefs = inMemoryFiefRepository([fief])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 6 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 6, freePeasants: 5 }))
    expect(fiefs.storedFiefOf('lord')).toBe(fief)
  })

  it('refuses an order that takes the peasants a waiting upgrade needs', async () => {
    const upgrading = storedFief({
      slot: {
        kind: 'busy',
        building: 'barracks',
        targetLevel: 2,
        startedAt: storedInstant,
        finishesAt: oneHourLater,
        cost: barracksLevel(2).cost,
      },
    })
    const fiefs = inMemoryFiefRepository([upgrading])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 5 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 5, freePeasants: 4 }))
    expect(fiefs.storedFiefOf('lord')).toBe(upgrading)
  })

  it('refuses an order of zero units', async () => {
    const fief = storedFief({})
    const fiefs = inMemoryFiefRepository([fief])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 0 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
    expect(fiefs.storedFiefOf('lord')).toBe(fief)
  })

  it('refuses an order of a fractional count', async () => {
    const fief = storedFief({})
    const fiefs = inMemoryFiefRepository([fief])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 1.5 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 1.5 }))
    expect(fiefs.storedFiefOf('lord')).toBe(fief)
  })

  it('recruits while the build slot and the study slot are busy', async () => {
    const buildSlot = {
      kind: 'busy',
      building: 'farm',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: oneHourLater,
      cost: farmLevel(1).cost,
    } as const
    const studySlot = {
      kind: 'busy',
      art: 'smithing',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: oneHourLater,
      cost: { wood: 40, stone: 30, iron: 50, gold: 20, food: 0 },
    } as const
    const fiefs = inMemoryFiefRepository([storedFief({ slot: buildSlot, studySlot })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 3 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toEqual(buildSlot)
    expect(stored?.buildQueue).toEqual([])
    expect(stored?.studySlot).toEqual(studySlot)
    expect(stored?.recruitOrder.kind).toBe('open')
  })
})

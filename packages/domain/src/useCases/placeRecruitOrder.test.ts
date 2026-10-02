import { assert, describe, expect, it } from 'vitest'
import { deliveredUnitsOf } from '../fief/deliveredUnitsOf'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import { recruitOrderEndsAt } from '../fief/recruitOrderEndsAt'
import type {
  BarracksLevel,
  BuildingCatalog,
  FarmLevel,
  FiefSettings,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { placeRecruitOrder } from './placeRecruitOrder'
import { resolveUpgrade } from './resolveUpgrade'

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
  forage: plainForage,
  camps: plainCamps,
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
    units: { infantry: 0, cavalry: 0 },
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

describe('placeRecruitOrder', () => {
  it('opens an order for N infantry in the idle recruit slot', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 3 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toEqual({
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
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 4 },
      { fiefs, catalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
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
        units: { ...plainUnits, infantry: { ...plainUnits.infantry, durationSeconds: 100 } },
      }),
    }

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog: hundredSecondInfantry, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({ perUnitSeconds: 34 })
  })

  it('charges the peasants of every unit ordered at once', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 3 },
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
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'BarracksNotBuilt' }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(unarmed)
  })

  it('refuses an order while the first barracks is only building', async () => {
    const raisingBarracks = storedFief({
      buildingLevels: levelsWithBarracks(0),
      slot: {
        kind: 'busy',
        building: 'barracks',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: oneHourLater,
        cost: barracksLevel(1).cost,
      },
    })
    const fiefs = inMemoryFiefRepository([raisingBarracks])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'BarracksNotBuilt' }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(raisingBarracks)
  })

  it('divides the unit duration by the built barracks level while an upgrade builds', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({
        slot: {
          kind: 'busy',
          building: 'barracks',
          targetLevel: 2,
          startedAt: storedInstant,
          finishesAt: oneHourLater,
          cost: barracksLevel(2).cost,
        },
      }),
    ])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({ perUnitSeconds: 45 })
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
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'RecruitSlotBusy', unit: 'infantry' }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(recruiting)
  })

  it('refuses an order the stocks cannot pay', async () => {
    const hungry = storedFief({ stocks: { wood: 500, stone: 100, iron: 300, gold: 100, food: 50 } })
    const fiefs = inMemoryFiefRepository([hungry])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 2 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(
      err({
        kind: 'InsufficientResources',
        missing: { wood: 0, stone: 0, iron: 0, gold: 0, food: 10 },
      }),
    )
    expect(fiefs.storedFiefOf('fief-1')).toBe(hungry)
  })

  it('refuses an order the free peasants cannot staff', async () => {
    const fiveFreePeasants = storedFief({})
    const fiefs = inMemoryFiefRepository([fiveFreePeasants])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 6 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 6, freePeasants: 5 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(fiveFreePeasants)
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
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 5 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 5, freePeasants: 4 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(upgrading)
  })

  it('refuses an order the built free peasants cannot staff while a farm is building', async () => {
    const farming = storedFief({
      slot: {
        kind: 'busy',
        building: 'farm',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: oneHourLater,
        cost: farmLevel(1).cost,
      },
    })
    const fiefs = inMemoryFiefRepository([farming])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 7 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 7, freePeasants: 5 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(farming)
  })

  it('refuses an order the busy upgrade would leave unstaffed before a queued farm lands', async () => {
    const barracksThenFarm = storedFief({
      slot: {
        kind: 'busy',
        building: 'barracks',
        targetLevel: 2,
        startedAt: storedInstant,
        finishesAt: oneHourLater,
        cost: barracksLevel(2).cost,
      },
      buildQueue: [
        { building: 'farm', targetLevel: 1, cost: farmLevel(1).cost, durationSeconds: 120 },
      ],
    })
    const fiefs = inMemoryFiefRepository([barracksThenFarm])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 5 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 5, freePeasants: 4 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(barracksThenFarm)
  })

  it('refuses an order a queued upgrade would leave unstaffed before a later farm lands', async () => {
    const barracksTwiceThenFarm = storedFief({
      slot: {
        kind: 'busy',
        building: 'barracks',
        targetLevel: 2,
        startedAt: storedInstant,
        finishesAt: oneHourLater,
        cost: barracksLevel(2).cost,
      },
      buildQueue: [
        { building: 'barracks', targetLevel: 3, cost: barracksLevel(3).cost, durationSeconds: 400 },
        { building: 'farm', targetLevel: 1, cost: farmLevel(1).cost, durationSeconds: 120 },
      ],
    })
    const fiefs = inMemoryFiefRepository([barracksTwiceThenFarm])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 4 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 4, freePeasants: 3 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(barracksTwiceThenFarm)
  })

  it('refuses an order of zero units', async () => {
    const armedFief = storedFief({})
    const fiefs = inMemoryFiefRepository([armedFief])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 0 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(armedFief)
  })

  it('refuses an order of a fractional count', async () => {
    const armedFief = storedFief({})
    const fiefs = inMemoryFiefRepository([armedFief])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1.5 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 1.5 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(armedFief)
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
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 3 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.slot).toEqual(buildSlot)
    expect(stored?.buildQueue).toEqual([])
    expect(stored?.studySlot).toEqual(studySlot)
    expect(stored?.recruitOrder.kind).toBe('open')
  })
})

const MILLISECONDS_PER_DAY = 86_400_000

const seasonEpoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterSeasonEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

const midSpring = daysAfterSeasonEpoch(3)

const midSummer = daysAfterSeasonEpoch(10)

const seasonalSettings: FiefSettings = {
  ...fiefSettings,
  seasons: {
    ...neutralSeasons,
    epoch: seasonEpoch,
    durationPercent: {
      spring: { build: 100, study: 100, train: 75, road: 100 },
      summer: { build: 75, study: 100, train: 100, road: 100 },
      autumn: { build: 100, study: 100, train: 100, road: 75 },
      winter: { build: 100, study: 75, train: 100, road: 100 },
    },
  },
}

const seasonalCatalog: BuildingCatalog = { ...catalog, fiefSettings: () => seasonalSettings }

describe('placeRecruitOrder across seasons', () => {
  it('shortens the unit duration in spring', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ storedAt: midSpring })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midSpring) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({ perUnitSeconds: 34 })
  })

  it('divides the unit duration by the barracks and the season with one rounding', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({ storedAt: midSpring, buildingLevels: levelsWithBarracks(2) }),
    ])
    const hundredSecondInfantry: BuildingCatalog = {
      ...seasonalCatalog,
      fiefSettings: () => ({
        ...seasonalSettings,
        units: { ...plainUnits, infantry: { ...plainUnits.infantry, durationSeconds: 100 } },
      }),
    }

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog: hundredSecondInfantry, clock: frozenClock(midSpring) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({ perUnitSeconds: 25 })
  })

  it('leaves the unit duration unchanged in summer', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ storedAt: midSummer })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midSummer) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({ perUnitSeconds: 45 })
  })

  it('fixes one duration for every unit of the order', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ storedAt: midSpring })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 3 },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midSpring) },
    )

    assert(result.ok)
    const order = fiefs.storedFiefOf('fief-1')?.recruitOrder
    assert(order?.kind === 'open')
    expect(deliveredUnitsOf(order, secondsAfter(midSpring, 67))).toBe(1)
    expect(deliveredUnitsOf(order, secondsAfter(midSpring, 68))).toBe(2)
    expect(recruitOrderEndsAt(order)).toEqual(secondsAfter(midSpring, 102))
  })

  it('keeps the spring duration of an order that runs into summer', async () => {
    const lateSpring = secondsAfter(daysAfterSeasonEpoch(7), -60)
    const fiefs = inMemoryFiefRepository([storedFief({ storedAt: lateSpring })])
    const placed = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 5 },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(lateSpring) },
    )
    assert(placed.ok)

    const result = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        camps: inMemoryCampRegistry([]),
        catalog: seasonalCatalog,
        clock: frozenClock(secondsAfter(lateSpring, 170)),
      },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.recruitOrder).toEqual({ kind: 'idle' })
    expect(stored?.units.countOf('infantry')).toBe(5)
  })
})

describe('placeRecruitOrder for riders', () => {
  it('refuses a rider below barracks level 3', async () => {
    const lowBarracks = storedFief({ buildingLevels: levelsWithBarracks(2) })
    const fiefs = inMemoryFiefRepository([lowBarracks])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'cavalry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(
      err({ kind: 'BarracksTooLow', unit: 'cavalry', requiredBarracksLevel: 3, barracksLevel: 2 }),
    )
    expect(fiefs.storedFiefOf('fief-1')).toBe(lowBarracks)
  })

  it('refuses an unbuilt barracks before a barracks too low', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ buildingLevels: levelsWithBarracks(0) })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'cavalry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'BarracksNotBuilt' }))
  })

  it('refuses a barracks too low before a busy recruit slot', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({
        buildingLevels: levelsWithBarracks(2),
        recruitOrder: {
          kind: 'open',
          unit: 'infantry',
          count: 1,
          cost: plainUnits.infantry.cost,
          perUnitSeconds: 30,
          startedAt: storedInstant,
        },
      }),
    ])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'cavalry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(
      err({ kind: 'BarracksTooLow', unit: 'cavalry', requiredBarracksLevel: 3, barracksLevel: 2 }),
    )
  })

  it('recruits riders at barracks level 3 in 75 seconds each', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ buildingLevels: levelsWithBarracks(3) })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'cavalry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toEqual({
      kind: 'open',
      unit: 'cavalry',
      count: 1,
      cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
      perUnitSeconds: 75,
      startedAt: storedInstant,
    })
  })

  it('trains a rider in 57 seconds in a 75 % spring', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({ storedAt: midSpring, buildingLevels: levelsWithBarracks(3) }),
    ])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'cavalry', count: 1 },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midSpring) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({ perUnitSeconds: 57 })
  })

  it('occupies two peasants per rider', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ buildingLevels: levelsWithBarracks(3) })])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'cavalry', count: 2 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'NotEnoughPeasants', requiredPeasants: 4, freePeasants: 3 }))
  })

  it('recruits infantry at barracks level 1 as before', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await placeRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', count: 1 },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.recruitOrder).toMatchObject({
      unit: 'infantry',
      perUnitSeconds: 45,
    })
  })
})

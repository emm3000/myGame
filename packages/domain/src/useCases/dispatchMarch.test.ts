import { assert, describe, expect, it } from 'vitest'
import { campOf } from '../camp/campOf'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import { marchInstantsOf } from '../march/marchInstantsOf'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { type HeldPlot, inMemoryKingdomMap } from '../testing/inMemoryKingdomMap'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { dispatchMarch } from './dispatchMarch'
import { enqueueBuilding } from './enqueueBuilding'
import { placeRecruitOrder } from './placeRecruitOrder'
import { startStudy } from './startStudy'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const dispatchInstant = Instant.fromEpochMilliseconds(86_400_000 + 180_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 20,
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

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const libraryAndBarracks: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 1,
  barracks: 1,
}

const lineCost = { wood: 10, stone: 10, iron: 0, gold: 0, food: 0 }

const workingCatalog: BuildingCatalog = {
  levelOf: (building, level) => {
    if (level !== 1) {
      return undefined
    }
    const line = { level, cost: lineCost, durationSeconds: 60, peasantOccupancy: 1 }
    if (building === 'sawmill') {
      return { ...line, building, ratePerHour: 10 }
    }
    return building === 'library' || building === 'barracks' ? { ...line, building } : undefined
  },
  artLevelOf: (art, level) =>
    art === 'smithing' && level === 1
      ? {
          art,
          level,
          cost: lineCost,
          durationSeconds: 60,
          requiredLibraryLevel: 1,
          resource: 'iron',
          ratePercent: 10,
        }
      : undefined,
  fiefSettings: () => fiefSettings,
}

const lordPlot: HeldPlot = {
  playerId: 'lord',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 1, plot: 1 },
}

const neighbourPlot: HeldPlot = {
  playerId: 'neighbour',
  name: 'Peña Alta',
  address: { kingdom: 1, province: 2, plot: 9 },
}

const map = inMemoryKingdomMap([lordPlot, neighbourPlot])

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: lordPlot.address,
    stocks: { wood: 500, stone: 100, iron: 300, gold: 100, food: 500 },
    storedAt: storedInstant,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 0,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 10, cavalry: 0 },
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

const campPlotOfProvinceTwo = (): number => {
  const plot = Array.from({ length: 15 }, (_, index) => index + 1).find(
    (candidate) => campOf({ kingdom: 1, province: 2, plot: candidate }, plainCamps) !== undefined,
  )
  assert(plot !== undefined)
  return plot
}

const tenInfantryForTwoHours = {
  playerId: 'lord',
  province: 2,
  plot: 5,
  units: { infantry: 10, cavalry: 0 },
  stayHours: 2,
}

const dependenciesOver = (fief: Fief) => {
  const fiefs = inMemoryFiefRepository([fief])
  return { fiefs, map, catalog, clock: frozenClock(dispatchInstant) }
}

describe('dispatchMarch', () => {
  it('sends the infantry at home to a free plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch(tenInfantryForTwoHours, dependencies)

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      kind: 'away',
      order: 'forage',
      province: 2,
      plot: 5,
      units: { infantry: 10, cavalry: 0 },
      stayHours: 2,
      departedAt: dispatchInstant,
    })
  })

  it('fixes the road time from the fief to the plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({ oneWaySeconds: 840 })
  })

  it('fixes the loot at dispatch from the plot terrain', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
    })
  })

  it('stores a whole loot percent of 100 per resource', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    })
  })

  it('keeps the peasants of the infantry away', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesOver(fief)

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    const away = dependencies.fiefs.storedFiefOf('lord')
    assert(away !== undefined)
    const peasantsOf = (held: Fief) =>
      derivePeasantCounts(held.buildingLevels, held.units, held.recruitOrder, catalog)
    expect(peasantsOf(away)).toEqual(peasantsOf(fief))
  })

  it('debits nothing and keeps the stored instant', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesOver(fief)

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    const away = dependencies.fiefs.storedFiefOf('lord')
    expect(away?.stocks).toEqual(fief.stocks)
    expect(away?.storedAt).toBe(fief.storedAt)
  })

  it('refuses a player who holds no fief', async () => {
    const result = await dispatchMarch(
      { ...tenInfantryForTwoHours, playerId: 'landless' },
      dependenciesOver(storedFief({})),
    )

    expect(result).toEqual(err({ kind: 'FiefNotFound', playerId: 'landless' }))
  })

  it('reports a fief the repository cannot read', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    const unreadable = {
      ...dependencies,
      fiefs: {
        ...dependencies.fiefs,
        fiefOf: async () => err({ kind: 'NegativeResourceAmount', amount: -1 } as const),
      },
    }

    const result = await dispatchMarch(tenInfantryForTwoHours, unreadable)

    expect(result).toEqual(err({ kind: 'NegativeResourceAmount', amount: -1 }))
  })

  it('reports a march the repository refuses to save', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    const unsaveable = {
      ...dependencies,
      fiefs: {
        ...dependencies.fiefs,
        save: async (fief: Fief) =>
          err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates } as const),
      },
    }

    const result = await dispatchMarch(tenInfantryForTwoHours, unsaveable)

    expect(result).toEqual(
      err({ kind: 'CoordinatesTaken', coordinates: storedFief({}).coordinates }),
    )
  })

  it('counts the units an open order has delivered as at home', async () => {
    const recruiting = storedFief({
      units: { infantry: 0, cavalry: 0 },
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 5,
        cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
        perUnitSeconds: 60,
        startedAt: storedInstant,
      },
    })

    const tooMany = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 4, cavalry: 0 } },
      dependenciesOver(recruiting),
    )
    const delivered = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 3, cavalry: 0 } },
      dependenciesOver(recruiting),
    )

    expect(tooMany).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'infantry', count: 4, atHome: 3 }),
    )
    assert(delivered.ok)
  })

  it('refuses a march while another is away', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 4, cavalry: 0 } },
      dependencies,
    )

    const result = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 4, cavalry: 0 } },
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'MarchSlotBusy' }))
  })

  it('refuses a march to a plot holding a fief', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 9 }, dependencies)

    expect(result).toEqual(err({ kind: 'PlotHeld', province: 2, plot: 9 }))
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a forage march to a camp plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    const campPlot = campPlotOfProvinceTwo()

    const result = await dispatchMarch({ ...tenInfantryForTwoHours, plot: campPlot }, dependencies)

    expect(result).toEqual(err({ kind: 'PlotHasCamp', province: 2, plot: campPlot }))
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a march to the fief own plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch(
      { ...tenInfantryForTwoHours, province: 1, plot: 1 },
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'MarchToOwnPlot' }))
  })

  it('refuses more infantry than are at home', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 11, cavalry: 0 } },
      dependencies,
    )

    expect(result).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'infantry', count: 11, atHome: 10 }),
    )
  })

  it('refuses a count of infantry below one or fractional', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const none = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 0, cavalry: 0 } },
      dependencies,
    )
    const fractional = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 1.5, cavalry: 0 } },
      dependencies,
    )

    expect(none).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
    expect(fractional).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 1.5 }))
  })

  it('refuses a stay of zero hours or of nine', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const stays = await Promise.all(
      [0, 9, 1.5].map((stayHours) =>
        dispatchMarch({ ...tenInfantryForTwoHours, stayHours }, dependencies),
      ),
    )
    const longest = await dispatchMarch({ ...tenInfantryForTwoHours, stayHours: 8 }, dependencies)

    expect(stays).toEqual([
      err({ kind: 'StayOutOfRange', stayHours: 0 }),
      err({ kind: 'StayOutOfRange', stayHours: 9 }),
      err({ kind: 'StayOutOfRange', stayHours: 1.5 }),
    ])
    assert(longest.ok)
  })

  it('refuses a province past the last held one plus one', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const past = await dispatchMarch({ ...tenInfantryForTwoHours, province: 4 }, dependencies)
    const none = await dispatchMarch({ ...tenInfantryForTwoHours, province: 0 }, dependencies)
    const lastPlusOne = await dispatchMarch(
      { ...tenInfantryForTwoHours, province: 3 },
      dependencies,
    )

    expect(past).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 4, plot: 5 }))
    expect(none).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 0, plot: 5 }))
    assert(lastPlusOne.ok)
  })

  it('refuses a plot past the plots of a province', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const past = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 16 }, dependencies)
    const none = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 0 }, dependencies)
    const last = await dispatchMarch(
      { ...tenInfantryForTwoHours, province: 3, plot: 15 },
      dependencies,
    )

    expect(past).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 2, plot: 16 }))
    expect(none).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 2, plot: 0 }))
    assert(last.ok)
  })

  it('refuses in order: count, stay, slot, bounds, own plot, held plot, camp, infantry at home', async () => {
    const away = dependenciesOver(storedFief({}))
    await dispatchMarch({ ...tenInfantryForTwoHours, units: { infantry: 4, cavalry: 0 } }, away)
    const idle = dependenciesOver(storedFief({}))

    const refusals = await Promise.all([
      dispatchMarch(
        { ...tenInfantryForTwoHours, units: { infantry: 0, cavalry: 0 }, stayHours: 0 },
        away,
      ),
      dispatchMarch({ ...tenInfantryForTwoHours, stayHours: 0, province: 9 }, away),
      dispatchMarch({ ...tenInfantryForTwoHours, province: 9 }, away),
      dispatchMarch(
        { ...tenInfantryForTwoHours, units: { infantry: 11, cavalry: 0 }, province: 1, plot: 16 },
        idle,
      ),
      dispatchMarch(
        { ...tenInfantryForTwoHours, units: { infantry: 11, cavalry: 0 }, province: 1, plot: 1 },
        idle,
      ),
      dispatchMarch(
        { ...tenInfantryForTwoHours, units: { infantry: 11, cavalry: 0 }, plot: 9 },
        idle,
      ),
      dispatchMarch(
        {
          ...tenInfantryForTwoHours,
          units: { infantry: 11, cavalry: 0 },
          plot: campPlotOfProvinceTwo(),
        },
        idle,
      ),
      dispatchMarch({ ...tenInfantryForTwoHours, units: { infantry: 11, cavalry: 0 } }, idle),
    ])

    expect(refusals.map((refusal) => (refusal.ok ? 'sent' : refusal.error.kind))).toEqual([
      'InvalidUnitCount',
      'StayOutOfRange',
      'MarchSlotBusy',
      'MarchTargetOutOfBounds',
      'MarchToOwnPlot',
      'PlotHeld',
      'PlotHasCamp',
      'NotEnoughUnitsAtHome',
    ])
  })

  it('marches while the build, study and recruit slots are busy', async () => {
    const busy = storedFief({
      buildingLevels: {
        sawmill: 0,
        quarry: 0,
        ironMine: 0,
        farm: 0,
        warehouse: 0,
        library: 1,
        barracks: 1,
      },
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 3_600_000),
        cost: { wood: 40, stone: 10, iron: 0, gold: 0, food: 0 },
      },
      buildQueue: [
        {
          building: 'farm',
          targetLevel: 1,
          cost: { wood: 40, stone: 10, iron: 0, gold: 0, food: 0 },
          durationSeconds: 120,
        },
      ],
      studySlot: {
        kind: 'busy',
        art: 'smithing',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 3_600_000),
        cost: { wood: 30, stone: 0, iron: 60, gold: 25, food: 0 },
      },
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 5,
        cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
        perUnitSeconds: 3_600,
        startedAt: storedInstant,
      },
    })
    const dependencies = dependenciesOver(busy)

    const result = await dispatchMarch(tenInfantryForTwoHours, dependencies)

    assert(result.ok)
    const away = dependencies.fiefs.storedFiefOf('lord')
    expect(away?.march.kind).toBe('away')
    expect([away?.slot, away?.buildQueue, away?.studySlot, away?.recruitOrder]).toEqual([
      busy.slot,
      busy.buildQueue,
      busy.studySlot,
      busy.recruitOrder,
    ])
  })

  it('builds, studies and recruits while the march is away', async () => {
    const dependencies = {
      ...dependenciesOver(storedFief({ buildingLevels: libraryAndBarracks })),
      catalog: workingCatalog,
    }
    const sent = await dispatchMarch(
      { ...tenInfantryForTwoHours, units: { infantry: 4, cavalry: 0 } },
      dependencies,
    )
    assert(sent.ok)

    const building = await enqueueBuilding({ playerId: 'lord', building: 'sawmill' }, dependencies)
    const studying = await startStudy({ playerId: 'lord', art: 'smithing' }, dependencies)
    const recruiting = await placeRecruitOrder(
      { playerId: 'lord', unit: 'infantry', count: 1 },
      dependencies,
    )

    assert(building.ok && studying.ok && recruiting.ok)
    const busy = dependencies.fiefs.storedFiefOf('lord')
    expect([busy?.slot.kind, busy?.studySlot.kind, busy?.recruitOrder.kind, busy?.march]).toEqual([
      'busy',
      'busy',
      'open',
      sent.value.march,
    ])
  })
})

const mixedPartyFief = (): Fief =>
  storedFief({
    address: { kingdom: 1, province: 3, plot: 12 },
    units: { infantry: 12, cavalry: 6 },
  })

const mixedPartyForTwoHours = {
  playerId: 'lord',
  province: 2,
  plot: 7,
  units: { infantry: 12, cavalry: 6 },
  stayHours: 2,
}

describe('dispatchMarch with a party of several kinds', () => {
  it('sends infantry and riders on one march', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    const result = await dispatchMarch(mixedPartyForTwoHours, dependencies)

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      kind: 'away',
      province: 2,
      plot: 7,
      units: { infantry: 12, cavalry: 6 },
      oneWaySeconds: 900,
    })
  })

  it('refuses a march with no unit', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    const result = await dispatchMarch(
      { ...mixedPartyForTwoHours, units: { infantry: 0, cavalry: 0 } },
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
  })

  it('refuses a fractional rider count', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    const result = await dispatchMarch(
      { ...mixedPartyForTwoHours, units: { infantry: 12, cavalry: 1.5 } },
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'InvalidUnitCount', unit: 'cavalry', count: 1.5 }))
  })

  it('refuses more riders than are at home', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    const result = await dispatchMarch(
      { ...mixedPartyForTwoHours, units: { infantry: 0, cavalry: 7 } },
      dependencies,
    )

    expect(result).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'cavalry', count: 7, atHome: 6 }),
    )
  })

  it('names the first kind short', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    const result = await dispatchMarch(
      { ...mixedPartyForTwoHours, units: { infantry: 13, cavalry: 7 } },
      dependencies,
    )

    expect(result).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'infantry', count: 13, atHome: 12 }),
    )
  })

  it('keeps the riders away out of the units at home', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    await dispatchMarch(
      { ...mixedPartyForTwoHours, units: { infantry: 4, cavalry: 2 } },
      dependencies,
    )

    const atHome = dependencies.fiefs.storedFiefOf('lord')?.unitsAtHomeAt(dispatchInstant)
    expect([atHome?.countOf('infantry'), atHome?.countOf('cavalry')]).toEqual([8, 4])
  })

  it('fixes the loot of a mixed party at dispatch', async () => {
    const dependencies = dependenciesOver(mixedPartyFief())

    await dispatchMarch(mixedPartyForTwoHours, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
    })
  })
})

const MILLISECONDS_PER_DAY = 86_400_000

const seasonEpoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterSeasonEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

const unscaled = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const seasonalCatalog: BuildingCatalog = {
  ...catalog,
  fiefSettings: () => ({
    ...fiefSettings,
    seasons: {
      ...neutralSeasons,
      epoch: seasonEpoch,
      multiplierPercent: {
        ...neutralSeasons.multiplierPercent,
        spring: { ...unscaled, food: 125 },
        autumn: { ...unscaled, gold: 125 },
        winter: { ...unscaled, food: 75 },
      },
      durationPercent: {
        ...neutralSeasons.durationPercent,
        autumn: { ...neutralSeasons.durationPercent.autumn, road: 75 },
      },
    },
  }),
}

const homeOnTheMiddleRoad: HeldPlot = {
  ...lordPlot,
  address: { kingdom: 1, province: 3, plot: 12 },
}

const twelveInfantryToTheLowlands = {
  playerId: 'lord',
  province: 4,
  plot: 12,
  units: { infantry: 12, cavalry: 0 },
  stayHours: 2,
}

const seasonalDependencies = (now: Instant) => ({
  fiefs: inMemoryFiefRepository([
    storedFief({ address: homeOnTheMiddleRoad.address, units: { infantry: 12, cavalry: 0 } }),
  ]),
  map: inMemoryKingdomMap([homeOnTheMiddleRoad]),
  catalog: seasonalCatalog,
  clock: frozenClock(now),
})

describe('dispatchMarch across seasons', () => {
  it('fixes the road and the loot with the season in force at dispatch', async () => {
    const inSpring = seasonalDependencies(daysAfterSeasonEpoch(3))
    const inAutumn = seasonalDependencies(daysAfterSeasonEpoch(17))

    await dispatchMarch(twelveInfantryToTheLowlands, inSpring)
    await dispatchMarch(twelveInfantryToTheLowlands, inAutumn)

    expect(inSpring.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      oneWaySeconds: 600,
      loot: { wood: 72, stone: 0, iron: 0, gold: 0, food: 90 },
      lootPercent: { ...unscaled, food: 125 },
    })
    expect(inAutumn.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      oneWaySeconds: 450,
      loot: { wood: 72, stone: 0, iron: 0, gold: 0, food: 72 },
      lootPercent: { ...unscaled, gold: 125 },
    })
  })

  it('reads every percent as 100 before the epoch', async () => {
    const dependencies = seasonalDependencies(daysAfterSeasonEpoch(-3))

    await dispatchMarch(twelveInfantryToTheLowlands, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      oneWaySeconds: 600,
      loot: { wood: 72, stone: 0, iron: 0, gold: 0, food: 72 },
      lootPercent: unscaled,
    })
  })

  it('keeps the road and the return of a march across a season boundary', async () => {
    const lateSummer = secondsAfter(daysAfterSeasonEpoch(14), -60)
    const dependencies = seasonalDependencies(lateSummer)

    await dispatchMarch(twelveInfantryToTheLowlands, dependencies)

    const march = dependencies.fiefs.storedFiefOf('lord')?.march
    assert(march !== undefined && march.kind === 'away')
    expect(march.oneWaySeconds).toBe(600)
    expect(march.loot).toEqual({ wood: 72, stone: 0, iron: 0, gold: 0, food: 72 })
    expect(marchInstantsOf(march).returnsAt).toEqual(secondsAfter(lateSummer, 8_400))
  })
})

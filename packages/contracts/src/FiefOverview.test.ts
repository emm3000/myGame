import { describe, expect, it } from 'vitest'
import { type FiefOverview, FiefOverviewSchema } from './index'

type ResourceState = FiefOverview['resources']['wood']

const resource = (amount: number): ResourceState => ({
  amount,
  ratePerHour: 30,
  capacity: 1000,
})

const building = (level: number): FiefOverview['buildings']['sawmill'] => ({
  level,
  nextLevel: {
    level: level + 1,
    cost: { wood: 90, stone: 23, iron: 0, gold: 0, food: 0 },
    durationSeconds: 192,
    peasants: 1,
  },
})

const sixBuildings = {
  sawmill: building(2),
  quarry: building(1),
  ironMine: building(0),
  farm: building(1),
  warehouse: { level: 10, nextLevel: null },
  library: building(0),
  barracks: building(0),
}

const busySlot = {
  kind: 'busy',
  building: 'sawmill',
  targetLevel: 3,
  startedAt: '2026-09-22T13:50:00.000Z',
  finishesAt: '2026-09-22T14:30:00.000Z',
}

const waitingQuarry = {
  building: 'quarry',
  targetLevel: 2,
  startsAt: '2026-09-22T14:30:00.000Z',
  finishesAt: '2026-09-22T14:36:24.000Z',
}

const busyStudy = {
  kind: 'busy',
  art: 'smithing',
  targetLevel: 1,
  startedAt: '2026-09-22T13:50:00.000Z',
  finishesAt: '2026-09-22T14:05:00.000Z',
}

const twoArts = {
  smithing: {
    level: 0,
    resource: 'iron',
    ratePercent: 0,
    nextLevel: {
      level: 1,
      cost: { wood: 120, stone: 80, iron: 150, gold: 60, food: 0 },
      durationSeconds: 900,
      requiredLibraryLevel: 1,
      ratePercent: 5,
    },
  },
  masonry: { level: 10, resource: 'stone', ratePercent: 50, nextLevel: null },
}

const autumnOfYearOne = {
  kind: 'autumn',
  year: 1,
  endsAt: '2026-10-26T00:00:00.000Z',
  multiplierPercent: { wood: 100, stone: 100, iron: 100, gold: 125, food: 100 },
  durationPercent: { build: 100, study: 100, train: 100, road: 75 },
}

const infantryTerms = {
  cost: { wood: 20, stone: 0, iron: 10, gold: 0, food: 30 },
  peasants: 1,
  perUnitSeconds: 45,
}

const cavalryTerms = {
  cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
  peasants: 2,
  perUnitSeconds: 150,
}

const archerTerms = {
  cost: { wood: 40, stone: 0, iron: 10, gold: 5, food: 40 },
  peasants: 1,
  perUnitSeconds: 75,
}

const settlerTerms = {
  cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
  peasants: 4,
  perUnitSeconds: 3600,
}

const openOrder = {
  unit: 'infantry',
  count: 3,
  delivered: 1,
  perUnitSeconds: 45,
  startedAt: '2026-09-22T13:59:00.000Z',
  endsAt: '2026-09-22T14:01:15.000Z',
}

const awayMarch = {
  province: 2,
  plot: 5,
  terrain: 'uplands',
  units: { infantry: 5, cavalry: 0, archer: 0, settler: 0 },
  stayHours: 2,
  departedAt: '2026-09-22T14:00:00.000Z',
  oneWaySeconds: 840,
  loot: { wood: 30, stone: 30, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T14:14:00.000Z',
  leavesAt: '2026-09-22T16:14:00.000Z',
  returnsAt: '2026-09-22T16:28:00.000Z',
  recalledAt: null,
  order: 'forage',
  camp: null,
  fought: false,
}

const attackMarch = {
  ...awayMarch,
  order: 'attack',
  stayHours: 0,
  loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
  leavesAt: '2026-09-22T14:14:00.000Z',
  returnsAt: '2026-09-22T14:28:00.000Z',
  camp: { tier: 1, strength: 6 },
  fought: false,
}

const foundingMarch = {
  ...attackMarch,
  order: 'found',
  name: 'Sotoverde del Páramo',
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  camp: null,
  fought: false,
}

const transportMarch = {
  ...attackMarch,
  order: 'transport',
  toFiefId: '6f1c2a5e-3b7d-4c8e-9a10-2b3c4d5e6f70',
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  units: { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  camp: null,
  fought: false,
}

const cargoFromSotoverde = {
  fromFiefId: '6f1c2a5e-3b7d-4c8e-9a10-2b3c4d5e6f70',
  from: { name: 'Sotoverde', province: 3, plot: 12 },
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T14:07:30.000Z',
}

const marchRecalledOnTheRoad = {
  ...awayMarch,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T14:10:00.000Z',
  leavesAt: '2026-09-22T14:10:00.000Z',
  returnsAt: '2026-09-22T14:20:00.000Z',
  recalledAt: '2026-09-22T14:10:00.000Z',
}

const shippedForageTerms = {
  secondsPerProvince: 600,
  secondsPerPlot: 60,
  maxStayHours: 8,
  yieldPerHour: {
    lowlands: { wood: 3, stone: 0, iron: 0, gold: 0, food: 3 },
    uplands: { wood: 3, stone: 3, iron: 0, gold: 0, food: 0 },
    ridges: { wood: 0, stone: 3, iron: 3, gold: 0, food: 0 },
  },
}

const shippedUnitTerms = {
  infantry: { strength: 1, carry: 48, roadPercent: 100, barracksLevel: 1 },
  cavalry: { strength: 2, carry: 120, roadPercent: 50, barracksLevel: 3 },
  archer: { strength: 1, carry: 24, roadPercent: 100, barracksLevel: 2 },
  settler: { strength: 0, carry: 0, roadPercent: 100, barracksLevel: 5 },
}

const shippedCombatTerms = {
  lootPerStrength: 60,
  tiers: {
    1: { maxStrength: 6, regrowHours: 6 },
    2: { maxStrength: 15, regrowHours: 12 },
    3: { maxStrength: 40, regrowHours: 24 },
  },
}

const overviewWithSlot = (slot: unknown): Record<string, unknown> => ({
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  name: 'Vado Gris',
  coordinates: { kingdom: 1, province: 2, plot: 3 },
  terrain: 'uplands',
  resources: {
    wood: resource(420),
    stone: resource(310),
    iron: resource(120),
    gold: resource(50),
    food: resource(260),
  },
  buildings: sixBuildings,
  peasants: {
    supplied: 12,
    occupied: 7,
    free: 5,
    projectedSupplied: 17,
    projectedOccupied: 14,
    projectedFree: 3,
    lowestFree: 2,
  },
  slot,
  queue: { entries: [waitingQuarry], cap: 4 },
  study: { kind: 'idle' },
  arts: twoArts,
  season: autumnOfYearOne,
  units: { infantry: 4, cavalry: 2, archer: 0, settler: 0 },
  recruitOrder: openOrder,
  recruitTerms: {
    infantry: infantryTerms,
    cavalry: cavalryTerms,
    archer: archerTerms,
    settler: settlerTerms,
  },
  unitTerms: shippedUnitTerms,
  march: awayMarch,
  forageTerms: shippedForageTerms,
  combatTerms: shippedCombatTerms,
  incomingCargo: null,
  readAt: '2026-09-22T14:00:00.000Z',
})

describe('FiefOverviewSchema', () => {
  it('parses a fief overview with a busy slot', () => {
    const busyOverview = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.parse(busyOverview)).toEqual(busyOverview)
  })

  it('parses a fief overview with an idle slot', () => {
    const idleOverview = overviewWithSlot({ kind: 'idle' })

    expect(FiefOverviewSchema.parse(idleOverview)).toEqual(idleOverview)
  })

  it('rejects a fief overview without its fief id', () => {
    const { id: _id, ...withoutId } = overviewWithSlot({ kind: 'idle' })

    expect(FiefOverviewSchema.safeParse(withoutId).success).toBe(false)
  })

  it('rejects a finish instant that is not an ISO 8601 string', () => {
    const malformedInstantOverview = overviewWithSlot({ ...busySlot, finishesAt: 'not-a-date' })

    expect(FiefOverviewSchema.safeParse(malformedInstantOverview).success).toBe(false)
  })

  it('rejects a busy slot without a finish instant', () => {
    const { finishesAt: _, ...slotWithoutFinish } = busySlot

    expect(FiefOverviewSchema.safeParse(overviewWithSlot(slotWithoutFinish)).success).toBe(false)
  })

  it('rejects a busy slot without a start instant', () => {
    const { startedAt: _, ...slotWithoutStart } = busySlot

    expect(FiefOverviewSchema.safeParse(overviewWithSlot(slotWithoutStart)).success).toBe(false)
  })

  it('rejects a waiting upgrade without its start instant', () => {
    const { startsAt: _, ...unstartedQuarry } = waitingQuarry
    const overviewWithUnstartedEntry = {
      ...overviewWithSlot(busySlot),
      queue: { entries: [unstartedQuarry], cap: 4 },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithUnstartedEntry).success).toBe(false)
  })

  it('rejects a negative projected occupancy', () => {
    const busyOverview = overviewWithSlot(busySlot)
    const negativeOccupancyOverview = {
      ...busyOverview,
      peasants: { ...(busyOverview.peasants as object), projectedOccupied: -1 },
    }

    expect(FiefOverviewSchema.safeParse(negativeOccupancyOverview).success).toBe(false)
  })

  it('rejects an overview without the lowest free peasants across the schedule', () => {
    const busyOverview = overviewWithSlot(busySlot)
    const { lowestFree: _, ...peasantsWithoutLowest } = busyOverview.peasants as {
      lowestFree: number
    }
    const overviewWithoutLowest = { ...busyOverview, peasants: peasantsWithoutLowest }

    expect(FiefOverviewSchema.safeParse(overviewWithoutLowest).success).toBe(false)
  })

  it('rejects a negative build queue cap', () => {
    const negativeCapOverview = {
      ...overviewWithSlot(busySlot),
      queue: { entries: [waitingQuarry], cap: -1 },
    }

    expect(FiefOverviewSchema.safeParse(negativeCapOverview).success).toBe(false)
  })

  it('rejects a start instant that is not an ISO 8601 string', () => {
    const malformedStartOverview = overviewWithSlot({ ...busySlot, startedAt: 'not-a-date' })

    expect(FiefOverviewSchema.safeParse(malformedStartOverview).success).toBe(false)
  })

  it('rejects a fief overview missing one of the six buildings', () => {
    const { warehouse: _, ...fiveBuildings } = sixBuildings
    const incompleteOverview = { ...overviewWithSlot(busySlot), buildings: fiveBuildings }

    expect(FiefOverviewSchema.safeParse(incompleteOverview).success).toBe(false)
  })

  it('rejects a building without its next level', () => {
    const { nextLevel: _, ...levelOnly } = building(2)
    const overviewWithoutNextLevel = {
      ...overviewWithSlot(busySlot),
      buildings: { ...sixBuildings, sawmill: levelOnly },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithoutNextLevel).success).toBe(false)
  })

  it('parses a fief overview with a busy study', () => {
    const studyingOverview = { ...overviewWithSlot(busySlot), study: busyStudy }

    expect(FiefOverviewSchema.parse(studyingOverview)).toEqual(studyingOverview)
  })

  it('rejects a busy study without its art', () => {
    const { art: _, ...studyWithoutArt } = busyStudy
    const overviewWithNamelessStudy = { ...overviewWithSlot(busySlot), study: studyWithoutArt }

    expect(FiefOverviewSchema.safeParse(overviewWithNamelessStudy).success).toBe(false)
  })

  it('rejects a fief overview missing one of the two arts', () => {
    const { masonry: _, ...oneArt } = twoArts
    const overviewWithOneArt = { ...overviewWithSlot(busySlot), arts: oneArt }

    expect(FiefOverviewSchema.safeParse(overviewWithOneArt).success).toBe(false)
  })

  it('rejects an art that does not name the resource it raises', () => {
    const { resource: _, ...masonryWithoutResource } = twoArts.masonry
    const overviewWithUnnamedResource = {
      ...overviewWithSlot(busySlot),
      arts: { ...twoArts, masonry: masonryWithoutResource },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithUnnamedResource).success).toBe(false)
  })

  it('rejects an overview without a season', () => {
    const { season: _, ...seasonlessOverview } = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.safeParse(seasonlessOverview).success).toBe(false)
  })

  it('accepts a null season before the calendar starts', () => {
    const overviewBeforeTheEpoch = { ...overviewWithSlot(busySlot), season: null }

    expect(FiefOverviewSchema.parse(overviewBeforeTheEpoch)).toEqual(overviewBeforeTheEpoch)
  })

  it('accepts the road percent of the season in force', () => {
    const overviewInAutumn = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.parse(overviewInAutumn).season?.durationPercent.road).toBe(75)
  })

  it('rejects a season in year 0', () => {
    const overviewInYearZero = {
      ...overviewWithSlot(busySlot),
      season: { ...autumnOfYearOne, year: 0 },
    }

    expect(FiefOverviewSchema.safeParse(overviewInYearZero).success).toBe(false)
  })

  it('rejects a season missing a resource multiplier', () => {
    const { food: _, ...fourMultipliers } = autumnOfYearOne.multiplierPercent
    const overviewWithFourMultipliers = {
      ...overviewWithSlot(busySlot),
      season: { ...autumnOfYearOne, multiplierPercent: fourMultipliers },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithFourMultipliers).success).toBe(false)
  })
  it('rejects a season without duration percents', () => {
    const { durationPercent: _, ...seasonWithoutDurations } = autumnOfYearOne
    const overviewWithoutDurations = {
      ...overviewWithSlot(busySlot),
      season: seasonWithoutDurations,
    }

    expect(FiefOverviewSchema.safeParse(overviewWithoutDurations).success).toBe(false)
  })

  it('rejects a season missing its build percent', () => {
    const overviewWithoutBuildPercent = {
      ...overviewWithSlot(busySlot),
      season: { ...autumnOfYearOne, durationPercent: { study: 100, train: 100, road: 75 } },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithoutBuildPercent).success).toBe(false)
  })

  it('rejects a season missing its train percent', () => {
    const overviewWithoutTrainPercent = {
      ...overviewWithSlot(busySlot),
      season: { ...autumnOfYearOne, durationPercent: { build: 100, study: 100, road: 75 } },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithoutTrainPercent).success).toBe(false)
  })

  it('rejects a duration percent of zero', () => {
    const overviewWithZeroStudyPercent = {
      ...overviewWithSlot(busySlot),
      season: {
        ...autumnOfYearOne,
        durationPercent: { build: 100, study: 0, train: 100, road: 75 },
      },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithZeroStudyPercent).success).toBe(false)
  })

  it('rejects an overview without units', () => {
    const { units: _, ...overviewWithoutUnits } = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.safeParse(overviewWithoutUnits).success).toBe(false)
  })

  it('accepts a null recruit order', () => {
    const overviewWithIdleBarracks = { ...overviewWithSlot(busySlot), recruitOrder: null }

    expect(FiefOverviewSchema.parse(overviewWithIdleBarracks)).toEqual(overviewWithIdleBarracks)
  })

  it('rejects a recruit order of zero units', () => {
    const overviewWithEmptyOrder = {
      ...overviewWithSlot(busySlot),
      recruitOrder: { ...openOrder, count: 0, delivered: 0 },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithEmptyOrder).success).toBe(false)
  })

  it('accepts a null march', () => {
    const overviewWithIdleMarchSlot = { ...overviewWithSlot(busySlot), march: null }

    expect(FiefOverviewSchema.parse(overviewWithIdleMarchSlot)).toEqual(overviewWithIdleMarchSlot)
  })

  it('accepts a march that was not recalled', () => {
    const overviewWithUnrecalledMarch = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.parse(overviewWithUnrecalledMarch).march?.recalledAt).toBeNull()
  })

  it('accepts a recalled march', () => {
    const overviewWithRecalledMarch = {
      ...overviewWithSlot(busySlot),
      march: marchRecalledOnTheRoad,
    }

    expect(FiefOverviewSchema.parse(overviewWithRecalledMarch)).toEqual(overviewWithRecalledMarch)
  })

  it('rejects a march without its recall instant', () => {
    const { recalledAt: _, ...marchWithoutRecall } = awayMarch
    const overviewWithoutRecall = { ...overviewWithSlot(busySlot), march: marchWithoutRecall }

    expect(FiefOverviewSchema.safeParse(overviewWithoutRecall).success).toBe(false)
  })

  it('rejects a march with no unit', () => {
    const overviewWithEmptyMarch = {
      ...overviewWithSlot(busySlot),
      march: { ...awayMarch, units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 } },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithEmptyMarch).success).toBe(false)
  })

  it('accepts an attack march', () => {
    const overviewWithAttack = { ...overviewWithSlot(busySlot), march: attackMarch }

    expect(FiefOverviewSchema.parse(overviewWithAttack)).toEqual(overviewWithAttack)
  })

  it('accepts a founding march with the name of the new fief', () => {
    const overviewWithFounding = { ...overviewWithSlot(busySlot), march: foundingMarch }

    expect(FiefOverviewSchema.parse(overviewWithFounding)).toEqual(overviewWithFounding)
  })

  it('rejects a founding march without its name', () => {
    const { name: _, ...namelessFounding } = foundingMarch

    expect(
      FiefOverviewSchema.safeParse({ ...overviewWithSlot(busySlot), march: namelessFounding })
        .success,
    ).toBe(false)
  })

  it('accepts a transport march with its destination and its cargo', () => {
    const overviewWithTransport = { ...overviewWithSlot(busySlot), march: transportMarch }

    expect(FiefOverviewSchema.parse(overviewWithTransport)).toEqual(overviewWithTransport)
  })

  it('rejects a transport march without its cargo', () => {
    const { cargo: _, ...emptyHandedTransport } = transportMarch

    expect(
      FiefOverviewSchema.safeParse({ ...overviewWithSlot(busySlot), march: emptyHandedTransport })
        .success,
    ).toBe(false)
  })

  it('accepts an overview with a cargo on its way', () => {
    const overviewAwaitingCargo = {
      ...overviewWithSlot(busySlot),
      incomingCargo: cargoFromSotoverde,
    }

    expect(FiefOverviewSchema.parse(overviewAwaitingCargo)).toEqual(overviewAwaitingCargo)
  })

  it('rejects an incoming cargo without its arrival', () => {
    const { arrivesAt: _, ...cargoWithoutArrival } = cargoFromSotoverde

    expect(
      FiefOverviewSchema.safeParse({
        ...overviewWithSlot(busySlot),
        incomingCargo: cargoWithoutArrival,
      }).success,
    ).toBe(false)
  })

  it('rejects a forage march with a camp', () => {
    const overviewWithCampedForage = {
      ...overviewWithSlot(busySlot),
      march: { ...awayMarch, camp: { tier: 1, strength: 6 } },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithCampedForage).success).toBe(false)
  })

  it('rejects an attack march that stays', () => {
    const overviewWithStayingAttack = {
      ...overviewWithSlot(busySlot),
      march: { ...attackMarch, stayHours: 2 },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithStayingAttack).success).toBe(false)
  })

  it('rejects an overview without combat terms', () => {
    const { combatTerms: _, ...overviewWithoutCombatTerms } = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.safeParse(overviewWithoutCombatTerms).success).toBe(false)
  })

  it('rejects an overview without forage terms', () => {
    const { forageTerms: _, ...overviewWithoutForageTerms } = overviewWithSlot(busySlot)

    expect(FiefOverviewSchema.safeParse(overviewWithoutForageTerms).success).toBe(false)
  })

  it('accepts the unit terms of every kind', () => {
    expect(FiefOverviewSchema.parse(overviewWithSlot(busySlot)).unitTerms).toEqual({
      infantry: { strength: 1, carry: 48, roadPercent: 100, barracksLevel: 1 },
      cavalry: { strength: 2, carry: 120, roadPercent: 50, barracksLevel: 3 },
      archer: { strength: 1, carry: 24, roadPercent: 100, barracksLevel: 2 },
      settler: { strength: 0, carry: 0, roadPercent: 100, barracksLevel: 5 },
    })
  })

  it('rejects unit terms missing a kind', () => {
    expect(
      FiefOverviewSchema.safeParse({ ...overviewWithSlot(busySlot), unitTerms: {} }).success,
    ).toBe(false)
  })

  it('rejects unit terms that carry the recruit cost', () => {
    const infantryWithCost = { ...shippedUnitTerms.infantry, cost: infantryTerms.cost }

    expect(
      FiefOverviewSchema.safeParse({
        ...overviewWithSlot(busySlot),
        unitTerms: { infantry: infantryWithCost },
      }).success,
    ).toBe(false)
  })

  it('rejects combat terms that still carry a unit strength', () => {
    expect(
      FiefOverviewSchema.safeParse({
        ...overviewWithSlot(busySlot),
        combatTerms: { ...shippedCombatTerms, strength: 1 },
      }).success,
    ).toBe(false)
  })
})

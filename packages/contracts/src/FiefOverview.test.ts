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
  durationPercent: { build: 100, study: 100 },
}

const overviewWithSlot = (slot: unknown): Record<string, unknown> => ({
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
  },
  slot,
  queue: { entries: [waitingQuarry], cap: 4 },
  study: { kind: 'idle' },
  arts: twoArts,
  season: autumnOfYearOne,
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
      season: { ...autumnOfYearOne, durationPercent: { study: 100 } },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithoutBuildPercent).success).toBe(false)
  })

  it('rejects a duration percent of zero', () => {
    const overviewWithZeroStudyPercent = {
      ...overviewWithSlot(busySlot),
      season: { ...autumnOfYearOne, durationPercent: { build: 100, study: 0 } },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithZeroStudyPercent).success).toBe(false)
  })
})

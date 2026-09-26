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

const fiveBuildings = {
  sawmill: building(2),
  quarry: building(1),
  ironMine: building(0),
  farm: building(1),
  warehouse: { level: 10, nextLevel: null },
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
  buildings: fiveBuildings,
  peasants: { supplied: 12, occupied: 7, free: 5, projectedFree: 3 },
  slot,
  queue: { entries: [waitingQuarry], cap: 4 },
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

  it('rejects a fief overview missing one of the five buildings', () => {
    const { warehouse: _, ...fourBuildings } = fiveBuildings
    const incompleteOverview = { ...overviewWithSlot(busySlot), buildings: fourBuildings }

    expect(FiefOverviewSchema.safeParse(incompleteOverview).success).toBe(false)
  })

  it('rejects a building without its next level', () => {
    const { nextLevel: _, ...levelOnly } = building(2)
    const overviewWithoutNextLevel = {
      ...overviewWithSlot(busySlot),
      buildings: { ...fiveBuildings, sawmill: levelOnly },
    }

    expect(FiefOverviewSchema.safeParse(overviewWithoutNextLevel).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { type FiefOverview, FiefOverviewSchema } from './index'

type ResourceState = FiefOverview['resources']['wood']

const resource = (amount: number): ResourceState => ({
  amount,
  ratePerHour: 30,
  capacity: 1000,
})

const busySlot = {
  kind: 'busy',
  building: 'sawmill',
  targetLevel: 3,
  finishesAt: '2026-09-22T14:30:00.000Z',
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
  buildings: { sawmill: 2, quarry: 1, ironMine: 0, farm: 1, warehouse: 0 },
  peasants: { supplied: 12, occupied: 7, free: 5 },
  slot,
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

  it('rejects a fief overview missing one of the five buildings', () => {
    const { warehouse: _, ...fourBuildings } = {
      sawmill: 2,
      quarry: 1,
      ironMine: 0,
      farm: 1,
      warehouse: 0,
    }
    const incompleteOverview = { ...overviewWithSlot(busySlot), buildings: fourBuildings }

    expect(FiefOverviewSchema.safeParse(incompleteOverview).success).toBe(false)
  })
})

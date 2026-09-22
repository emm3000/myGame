import { describe, expect, it } from 'vitest'
import { FiefOverviewSchema } from './index'

const resource = (amount: number): { amount: number; ratePerHour: number; capacity: number } => ({
  amount,
  ratePerHour: 30,
  capacity: 1000,
})

const busySlotOverview = {
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
  buildings: [
    { building: 'sawmill', level: 2 },
    { building: 'quarry', level: 1 },
    { building: 'ironMine', level: 0 },
    { building: 'farm', level: 1 },
    { building: 'warehouse', level: 0 },
  ],
  peasants: { supplied: 12, occupied: 7, free: 5 },
  slot: {
    state: 'busy',
    building: 'sawmill',
    targetLevel: 3,
    finishesAt: '2026-09-22T14:30:00.000Z',
  },
  readAt: '2026-09-22T14:00:00.000Z',
}

describe('FiefOverviewSchema', () => {
  it('parses a fief overview with a busy slot', () => {
    expect(FiefOverviewSchema.parse(busySlotOverview)).toEqual(busySlotOverview)
  })
})

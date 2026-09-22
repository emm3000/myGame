import { describe, expect, it } from 'vitest'
import { BuildingContentSchema } from './index'

const farmLevelOne = {
  level: 1,
  cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
  durationSeconds: 90,
  peasantOccupancy: 1,
  effect: { ratePerHour: 20, peasantSupply: 4 },
}

const farmContent = (levels: unknown[]): unknown => ({ building: 'farm', levels })

describe('BuildingContentSchema', () => {
  it('parses a farm level with its food rate and peasant supply', () => {
    expect(BuildingContentSchema.parse(farmContent([farmLevelOne]))).toEqual(
      farmContent([farmLevelOne]),
    )
  })

  it('rejects a building level without a peasant occupancy', () => {
    const { peasantOccupancy: _, ...levelWithoutOccupancy } = farmLevelOne

    expect(BuildingContentSchema.safeParse(farmContent([levelWithoutOccupancy])).success).toBe(
      false,
    )
  })
})

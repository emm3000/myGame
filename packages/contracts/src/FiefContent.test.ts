import { describe, expect, it } from 'vitest'
import { FiefContentSchema } from './index'

const terrainBonus = {
  lowlands: { resource: 'food', ratePerHour: 10 },
  uplands: { resource: 'stone', ratePerHour: 10 },
  ridges: { resource: 'iron', ratePerHour: 10 },
}

const fiefContent = (bonus: unknown): unknown => ({
  startingStocks: { wood: 500, stone: 300, iron: 200, gold: 0, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
  terrainBonus: bonus,
})

describe('FiefContentSchema', () => {
  it('parses fief settings with a bonus for every terrain', () => {
    expect(FiefContentSchema.parse(fiefContent(terrainBonus))).toEqual(fiefContent(terrainBonus))
  })

  it('rejects fief settings missing the bonus of a terrain', () => {
    const { ridges: _, ...twoTerrains } = terrainBonus

    expect(FiefContentSchema.safeParse(fiefContent(twoTerrains)).success).toBe(false)
  })
})

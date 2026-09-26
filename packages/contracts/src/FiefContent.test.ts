import { describe, expect, it } from 'vitest'
import { FiefContentSchema } from './index'

const terrainBonus = {
  lowlands: { resource: 'food', ratePerHour: 10 },
  uplands: { resource: 'stone', ratePerHour: 10 },
  ridges: { resource: 'iron', ratePerHour: 10 },
}

const baseRates = { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 }

const fiefContent = (overrides: Record<string, unknown>): unknown => ({
  startingStocks: { wood: 500, stone: 300, iron: 200, gold: 0, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates,
  terrainBonus,
  buildQueueCap: 4,
  ...overrides,
})

const withoutQueueCap = (): unknown => {
  const { buildQueueCap: _, ...content } = fiefContent({}) as Record<string, unknown>
  return content
}

describe('FiefContentSchema', () => {
  it('rejects fief content without a queue cap', () => {
    expect(FiefContentSchema.safeParse(withoutQueueCap()).success).toBe(false)
  })

  it('reads how many entries may wait in the build queue', () => {
    expect(FiefContentSchema.parse(fiefContent({ buildQueueCap: 4 })).buildQueueCap).toBe(4)
  })

  it('parses fief settings with a bonus for every terrain', () => {
    expect(FiefContentSchema.parse(fiefContent({}))).toEqual(fiefContent({}))
  })

  it('rejects fief settings missing the bonus of a terrain', () => {
    const { ridges: _, ...twoTerrains } = terrainBonus

    expect(FiefContentSchema.safeParse(fiefContent({ terrainBonus: twoTerrains })).success).toBe(
      false,
    )
  })

  it('reads how many plots a province holds', () => {
    const parsed = FiefContentSchema.parse(fiefContent({ plotsPerProvince: 15 }))

    expect(parsed.plotsPerProvince).toBe(15)
  })

  it('rejects a province without plots', () => {
    expect(FiefContentSchema.safeParse(fiefContent({ plotsPerProvince: 0 })).success).toBe(false)
  })

  it('refuses content without a base rate for every resource', () => {
    const { gold: _, ...fourBaseRates } = baseRates

    expect(FiefContentSchema.safeParse(fiefContent({ baseRates: fourBaseRates })).success).toBe(
      false,
    )
  })
})

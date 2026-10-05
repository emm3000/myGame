import { describe, expect, it } from 'vitest'
import { FiefContentSchema } from './index'

const terrainBonus = {
  lowlands: { resource: 'food', ratePerHour: 10 },
  uplands: { resource: 'stone', ratePerHour: 10 },
  ridges: { resource: 'iron', ratePerHour: 10 },
}

const baseRates = { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 }

const unchangedRates = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const multiplierPercent = {
  spring: { ...unchangedRates, food: 125 },
  summer: unchangedRates,
  autumn: { ...unchangedRates, gold: 125 },
  winter: { ...unchangedRates, food: 75 },
}

const unchangedDurations = { build: 100, study: 100, train: 100, road: 100 }

const durationPercent = {
  spring: { ...unchangedDurations, train: 75 },
  summer: { ...unchangedDurations, build: 75 },
  autumn: unchangedDurations,
  winter: { ...unchangedDurations, study: 75 },
}

const seasons = {
  epoch: '2026-10-05T00:00:00Z',
  daysPerSeason: 7,
  multiplierPercent,
  durationPercent,
}

const infantry = {
  cost: { wood: 0, stone: 0, iron: 20, gold: 10, food: 30 },
  durationSeconds: 60,
  peasantOccupancy: 1,
  strength: 1,
  carry: 48,
  roadPercent: 100,
  barracksLevel: 1,
}

const cavalry = {
  cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
  durationSeconds: 300,
  peasantOccupancy: 2,
  strength: 2,
  carry: 120,
  roadPercent: 50,
  barracksLevel: 3,
}

const archer = {
  cost: { wood: 40, stone: 0, iron: 10, gold: 5, food: 40 },
  durationSeconds: 150,
  peasantOccupancy: 1,
  strength: 1,
  carry: 24,
  roadPercent: 100,
  barracksLevel: 2,
}

const settler = {
  cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
  durationSeconds: 7200,
  peasantOccupancy: 4,
  strength: 0,
  carry: 0,
  roadPercent: 100,
  barracksLevel: 5,
}

const units = { infantry, cavalry, archer, settler }

const noYield = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const yieldPerHour = {
  lowlands: { ...noYield, food: 3, wood: 3 },
  uplands: { ...noYield, wood: 3, stone: 3 },
  ridges: { ...noYield, stone: 3, iron: 3 },
}

const forage = {
  secondsPerProvince: 600,
  secondsPerPlot: 60,
  maxStayHours: 8,
  yieldPerHour,
}

const tiers = {
  1: { maxStrength: 6, regrowHours: 6 },
  2: { maxStrength: 15, regrowHours: 12 },
  3: { maxStrength: 40, regrowHours: 24 },
}

const camps = { campFraction: 0.2, lootPerStrength: 60, tiers }

const fiefContent = (overrides: Record<string, unknown>): unknown => ({
  startingStocks: { wood: 500, stone: 300, iron: 200, gold: 0, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates,
  terrainBonus,
  buildQueueCap: 4,
  fiefCap: 2,
  seasons,
  units,
  forage,
  camps,
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

  it('reads how many fiefs a lord may hold', () => {
    expect(FiefContentSchema.parse(fiefContent({ fiefCap: 2 })).fiefCap).toBe(2)
  })

  it('rejects a fief cap of 0', () => {
    expect(FiefContentSchema.safeParse(fiefContent({ fiefCap: 0 })).success).toBe(false)
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

  it('rejects seasons missing a season', () => {
    const { winter: _, ...threeSeasons } = multiplierPercent

    expect(
      FiefContentSchema.safeParse(
        fiefContent({ seasons: { ...seasons, multiplierPercent: threeSeasons } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season missing a resource', () => {
    const { food: _, ...fourResources } = unchangedRates

    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            multiplierPercent: { ...multiplierPercent, summer: fourResources },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a multiplier of zero', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            multiplierPercent: { ...multiplierPercent, winter: { ...unchangedRates, food: 0 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a negative multiplier', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            multiplierPercent: { ...multiplierPercent, winter: { ...unchangedRates, food: -75 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season shorter than a day', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ seasons: { ...seasons, daysPerSeason: 0 } }))
        .success,
    ).toBe(false)
  })

  it('rejects a calendar whose epoch is not an instant', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ seasons: { ...seasons, epoch: '2026-10-05' } }))
        .success,
    ).toBe(false)
  })

  it('rejects duration percents missing a season', () => {
    const { summer: _, ...threeSeasons } = durationPercent

    expect(
      FiefContentSchema.safeParse(
        fiefContent({ seasons: { ...seasons, durationPercent: threeSeasons } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season missing its study percent', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, winter: { build: 100, train: 100, road: 100 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season missing its train percent', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, spring: { build: 100, study: 100, road: 100 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a train percent of zero', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, spring: { ...unchangedDurations, train: 0 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season without a road percent', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, autumn: { build: 100, study: 100, train: 100 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season road percent of 0', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, autumn: { ...unchangedDurations, road: 0 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a duration percent of zero', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, summer: { ...unchangedDurations, build: 0 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects a negative duration percent', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          seasons: {
            ...seasons,
            durationPercent: { ...durationPercent, winter: { ...unchangedDurations, study: -75 } },
          },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects units missing the infantry', () => {
    expect(FiefContentSchema.safeParse(fiefContent({ units: {} })).success).toBe(false)
  })

  it('rejects content without cavalry terms', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ units: { infantry, archer, settler } })).success,
    ).toBe(false)
  })

  it('rejects content without archer terms', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ units: { infantry, cavalry, settler } })).success,
    ).toBe(false)
  })

  it('rejects content without settler terms', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ units: { infantry, cavalry, archer } })).success,
    ).toBe(false)
  })

  it('rejects a unit that occupies no peasants', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: { ...infantry, peasantOccupancy: 0 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a unit that trains in zero seconds', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: { ...infantry, durationSeconds: 0 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects forage terms that yield gold', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({
          forage: { ...forage, yieldPerHour: { ...yieldPerHour, ridges: { ...noYield, gold: 3 } } },
        }),
      ).success,
    ).toBe(false)
  })

  it('rejects forage terms missing the ridges', () => {
    const { ridges: _, ...twoTerrains } = yieldPerHour

    expect(
      FiefContentSchema.safeParse(fiefContent({ forage: { ...forage, yieldPerHour: twoTerrains } }))
        .success,
    ).toBe(false)
  })

  it('rejects a longest stay of zero hours', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ forage: { ...forage, maxStayHours: 0 } })).success,
    ).toBe(false)
  })

  it('rejects camp terms missing tier 3', () => {
    const { 3: _, ...twoTiers } = tiers

    expect(
      FiefContentSchema.safeParse(fiefContent({ camps: { ...camps, tiers: twoTiers } })).success,
    ).toBe(false)
  })

  it('rejects a camp fraction above 1', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ camps: { ...camps, campFraction: 1.2 } })).success,
    ).toBe(false)
  })

  it('accepts a unit with strength 0 and carry 0', () => {
    const parsed = FiefContentSchema.parse(fiefContent({}))

    expect(parsed.units.settler).toMatchObject({ strength: 0, carry: 0 })
  })

  it('rejects a negative strength', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: { ...infantry, strength: -1 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a fractional carry', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: { ...infantry, carry: 0.5 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects unit terms without a carry', () => {
    const { carry: _, ...infantryWithoutCarry } = infantry

    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: infantryWithoutCarry } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a road percent of 0', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: { ...infantry, roadPercent: 0 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a barracks level of 0', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { ...units, infantry: { ...infantry, barracksLevel: 0 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects forage terms with a carry of their own', () => {
    expect(
      FiefContentSchema.safeParse(fiefContent({ forage: { ...forage, carry: 48 } })).success,
    ).toBe(false)
  })
})

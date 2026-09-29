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

const unchangedDurations = { build: 100, study: 100, train: 100 }

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
}

const units = { infantry }

const noYield = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const yieldPerHour = {
  lowlands: { ...noYield, food: 3, wood: 3 },
  uplands: { ...noYield, wood: 3, stone: 3 },
  ridges: { ...noYield, stone: 3, iron: 3 },
}

const forage = {
  secondsPerProvince: 600,
  secondsPerPlot: 60,
  carryPerInfantry: 48,
  maxStayHours: 8,
  yieldPerHour,
}

const fiefContent = (overrides: Record<string, unknown>): unknown => ({
  startingStocks: { wood: 500, stone: 300, iron: 200, gold: 0, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates,
  terrainBonus,
  buildQueueCap: 4,
  seasons,
  units,
  forage,
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
            durationPercent: { ...durationPercent, winter: { build: 100, train: 100 } },
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
            durationPercent: { ...durationPercent, spring: { build: 100, study: 100 } },
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

  it('rejects a unit that occupies no peasants', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { infantry: { ...infantry, peasantOccupancy: 0 } } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a unit that trains in zero seconds', () => {
    expect(
      FiefContentSchema.safeParse(
        fiefContent({ units: { infantry: { ...infantry, durationSeconds: 0 } } }),
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
})

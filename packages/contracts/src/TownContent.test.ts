import { describe, expect, it } from 'vitest'
import { TownContentSchema } from './index'

const unscaled = { money: 100, food: 100, power: 100, material: 100 }

const productionPercent = {
  spring: unscaled,
  summer: { ...unscaled, food: 125 },
  fall: unscaled,
  winter: { ...unscaled, power: 75 },
}

const durationPercent = {
  spring: { build: 100, study: 100, hire: 75 },
  summer: { build: 75, study: 100, hire: 100 },
  fall: { build: 100, study: 100, hire: 100 },
  winter: { build: 100, study: 75, hire: 100 },
}

const townContent = (overrides: Record<string, unknown> = {}): unknown => ({
  startingStocks: { money: 400, food: 300, power: 200, material: 500 },
  taxRatePerHour: 12,
  basePeople: 10,
  cityPeople: 200,
  storageBaseCapacity: 1000,
  sitesPerArea: 15,
  terrainBonusPerHour: 5,
  waitingListCap: 4,
  seasons: {
    epoch: '2026-10-05T00:00:00Z',
    daysPerSeason: 7,
    productionPercent,
    durationPercent,
  },
  ...overrides,
})

describe('TownContentSchema', () => {
  it('parses the settings with a production percent for fall', () => {
    expect(TownContentSchema.parse(townContent()).seasons.productionPercent.fall).toEqual(unscaled)
  })

  it('refuses a calendar without a percent for fall', () => {
    const { fall: _, ...threeSeasons } = productionPercent
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent: threeSeasons,
      durationPercent,
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('refuses a build percent of 0', () => {
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent,
      durationPercent: { ...durationPercent, winter: { build: 0, study: 75, hire: 100 } },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('parses the study percent of each season', () => {
    expect(TownContentSchema.parse(townContent()).seasons.durationPercent.winter).toEqual({
      build: 100,
      study: 75,
      hire: 100,
    })
  })

  it('refuses a season without a hire percent', () => {
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent,
      durationPercent: { ...durationPercent, winter: { build: 100, study: 75 } },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('refuses a season without a study percent', () => {
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent,
      durationPercent: { ...durationPercent, winter: { build: 100, hire: 100 } },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('refuses an area without sites', () => {
    expect(TownContentSchema.safeParse(townContent({ sitesPerArea: 0 })).success).toBe(false)
  })

  it('refuses a fractional starting stock', () => {
    const startingStocks = { money: 400.5, food: 300, power: 200, material: 500 }

    expect(TownContentSchema.safeParse(townContent({ startingStocks })).success).toBe(false)
  })
})

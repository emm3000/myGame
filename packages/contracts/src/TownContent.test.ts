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
  spring: { build: 100, study: 100, hire: 75, road: 100 },
  summer: { build: 75, study: 100, hire: 100, road: 100 },
  fall: { build: 100, study: 100, hire: 100, road: 75 },
  winter: { build: 100, study: 75, hire: 100, road: 100 },
}

const payPerHour = {
  fields: { money: 0, food: 3, power: 0, material: 3 },
  river: { money: 0, food: 0, power: 3, material: 3 },
  hills: { money: 0, food: 3, power: 0, material: 3 },
}

const job = { secondsPerArea: 600, secondsPerSite: 60, maxHours: 8, payPerHour }

const waste = {
  siteFraction: 0.2,
  moneyPerPoint: 2,
  materialPerPoint: 3,
  sizes: {
    1: { maxWaste: 6, regrowHours: 6 },
    2: { maxWaste: 15, regrowHours: 12 },
    3: { maxWaste: 40, regrowHours: 24 },
  },
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
  job,
  waste,
  seasons: {
    epoch: '2026-10-05T00:00:00Z',
    daysPerSeason: 7,
    productionPercent,
    durationPercent,
  },
  goals: [
    { building: 'farm', level: 1 },
    { building: 'factory', level: 1 },
  ],
  tips: ['people', 'waitingList'],
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
      durationPercent: {
        ...durationPercent,
        winter: { build: 0, study: 75, hire: 100, road: 100 },
      },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('parses the study percent of each season', () => {
    expect(TownContentSchema.parse(townContent()).seasons.durationPercent.winter).toEqual({
      build: 100,
      study: 75,
      hire: 100,
      road: 100,
    })
  })

  it('refuses a season without a hire percent', () => {
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent,
      durationPercent: { ...durationPercent, winter: { build: 100, study: 75, road: 100 } },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('refuses a season without a study percent', () => {
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent,
      durationPercent: { ...durationPercent, winter: { build: 100, hire: 100, road: 100 } },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('refuses a season without a road percent', () => {
    const seasons = {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      productionPercent,
      durationPercent: { ...durationPercent, fall: { build: 100, study: 100, hire: 100 } },
    }

    expect(TownContentSchema.safeParse(townContent({ seasons })).success).toBe(false)
  })

  it('parses the job terms with the pay per hour of each terrain', () => {
    expect(TownContentSchema.parse(townContent()).job).toEqual(job)
  })

  it('refuses content that pays money from a job', () => {
    const paidInMoney = {
      ...job,
      payPerHour: { ...payPerHour, river: { money: 2, food: 0, power: 3, material: 3 } },
    }

    expect(TownContentSchema.safeParse(townContent({ job: paidInMoney })).success).toBe(false)
  })

  it('refuses a job of no hours at most', () => {
    expect(TownContentSchema.safeParse(townContent({ job: { ...job, maxHours: 0 } })).success).toBe(
      false,
    )
  })

  it('parses the waste terms with three sizes', () => {
    expect(TownContentSchema.parse(townContent()).waste).toEqual({
      ...waste,
      sizes: {
        '1': { maxWaste: 6, regrowHours: 6 },
        '2': { maxWaste: 15, regrowHours: 12 },
        '3': { maxWaste: 40, regrowHours: 24 },
      },
    })
  })

  it('refuses a waste fraction above 1', () => {
    expect(
      TownContentSchema.safeParse(townContent({ waste: { ...waste, siteFraction: 1.2 } })).success,
    ).toBe(false)
  })

  it('refuses a waste size that never regrows', () => {
    const sizes = { ...waste.sizes, 2: { maxWaste: 15, regrowHours: 0 } }

    expect(TownContentSchema.safeParse(townContent({ waste: { ...waste, sizes } })).success).toBe(
      false,
    )
  })

  it('refuses a fourth waste size', () => {
    const sizes = { ...waste.sizes, 4: { maxWaste: 80, regrowHours: 48 } }

    expect(TownContentSchema.safeParse(townContent({ waste: { ...waste, sizes } })).success).toBe(
      false,
    )
  })

  it('refuses an area without sites', () => {
    expect(TownContentSchema.safeParse(townContent({ sitesPerArea: 0 })).success).toBe(false)
  })

  it('refuses a fractional starting stock', () => {
    const startingStocks = { money: 400.5, food: 300, power: 200, material: 500 }

    expect(TownContentSchema.safeParse(townContent({ startingStocks })).success).toBe(false)
  })

  it('parses the goals in their order', () => {
    expect(TownContentSchema.parse(townContent()).goals).toEqual([
      { building: 'farm', level: 1 },
      { building: 'factory', level: 1 },
    ])
  })

  it('refuses a goal at level 0', () => {
    const goals = [{ building: 'farm', level: 0 }]

    expect(TownContentSchema.safeParse(townContent({ goals })).success).toBe(false)
  })

  it('refuses a goal on a building the town lacks', () => {
    const goals = [{ building: 'library', level: 1 }]

    expect(TownContentSchema.safeParse(townContent({ goals })).success).toBe(false)
  })

  it('parses the tips in their order', () => {
    expect(TownContentSchema.parse(townContent()).tips).toEqual(['people', 'waitingList'])
  })

  it('refuses a tip the town does not know', () => {
    const tips = ['peasants']

    expect(TownContentSchema.safeParse(townContent({ tips })).success).toBe(false)
  })

  it('refuses a tip listed twice', () => {
    const tips = ['people', 'office', 'people']

    expect(TownContentSchema.safeParse(townContent({ tips })).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import type { FiefSettings } from '../ports/BuildingCatalog'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { durationPercentAt } from './durationPercentAt'

const MILLISECONDS_PER_DAY = 86_400_000

const epoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const neutralRates = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const shippedSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 5 },
    uplands: { resource: 'stone', ratePerHour: 4 },
    ridges: { resource: 'iron', ratePerHour: 2 },
  },
  buildQueueCap: 4,
  units: plainUnits,
  seasons: {
    epoch,
    daysPerSeason: 7,
    multiplierPercent: {
      spring: neutralRates,
      summer: neutralRates,
      autumn: neutralRates,
      winter: neutralRates,
    },
    durationPercent: {
      spring: { build: 90, study: 90, train: 75 },
      summer: { build: 75, study: 100, train: 100 },
      autumn: { build: 100, study: 100, train: 100 },
      winter: { build: 100, study: 75, train: 100 },
    },
  },
}

describe('durationPercentAt', () => {
  it('answers neutral duration percents before the epoch', () => {
    expect(durationPercentAt(daysAfterEpoch(-0.001), shippedSettings)).toEqual({
      build: 100,
      study: 100,
      train: 100,
    })
  })

  it('answers a neutral train percent before the epoch', () => {
    expect(durationPercentAt(daysAfterEpoch(-0.001), shippedSettings).train).toBe(100)
  })

  it('answers the percents of the season in force', () => {
    expect(durationPercentAt(daysAfterEpoch(7), shippedSettings)).toEqual({
      build: 75,
      study: 100,
      train: 100,
    })
  })
})

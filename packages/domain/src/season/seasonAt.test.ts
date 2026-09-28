import { describe, expect, it } from 'vitest'
import type { FiefSettings } from '../ports/BuildingCatalog'
import { Instant } from '../time/Instant'
import { seasonAt } from './seasonAt'

const MILLISECONDS_PER_DAY = 86_400_000

const epoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const weeklySettings: FiefSettings = {
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
  seasons: {
    epoch,
    daysPerSeason: 7,
    multiplierPercent: {
      spring: neutralPercents,
      summer: neutralPercents,
      autumn: neutralPercents,
      winter: neutralPercents,
    },
  },
}

describe('seasonAt', () => {
  it('starts spring of year 1 at the epoch', () => {
    expect(seasonAt(epoch, weeklySettings)).toEqual({
      kind: 'spring',
      year: 1,
      endsAt: daysAfterEpoch(7),
    })
  })

  it('turns to summer seven days after the epoch', () => {
    expect(seasonAt(daysAfterEpoch(7.5), weeklySettings)).toEqual({
      kind: 'summer',
      year: 1,
      endsAt: daysAfterEpoch(14),
    })
  })

  it('starts year 2 in spring 28 days after the epoch', () => {
    expect(seasonAt(daysAfterEpoch(28), weeklySettings)).toEqual({
      kind: 'spring',
      year: 2,
      endsAt: daysAfterEpoch(35),
    })
  })

  it('answers no season before the epoch', () => {
    expect(seasonAt(daysAfterEpoch(-0.001), weeklySettings)).toBeUndefined()
  })

  it('ends a season at the instant the next begins', () => {
    const lastInstantOfAutumn = Instant.fromEpochMilliseconds(
      daysAfterEpoch(21).epochMilliseconds - 1,
    )

    expect(seasonAt(lastInstantOfAutumn, weeklySettings)?.kind).toBe('autumn')
    expect(seasonAt(daysAfterEpoch(21), weeklySettings)).toEqual({
      kind: 'winter',
      year: 1,
      endsAt: daysAfterEpoch(28),
    })
  })
})

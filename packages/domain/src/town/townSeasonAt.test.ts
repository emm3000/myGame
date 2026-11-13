import { describe, expect, it } from 'vitest'
import { plainTownSettings } from '../testing/townCatalogOf'
import { Instant } from '../time/Instant'
import type { TownSettings } from './TownSettings'
import { townSeasonAt } from './townSeasonAt'

const MILLISECONDS_PER_DAY = 86_400_000

const epoch = plainTownSettings.seasons.epoch

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const unscaled = { money: 100, food: 100, power: 100, material: 100 }

const unscaledDurations = { build: 100, study: 100, hire: 100, road: 100 }

const scaledSeasonSettings: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    productionPercent: {
      spring: unscaled,
      summer: { ...unscaled, food: 125 },
      fall: unscaled,
      winter: unscaled,
    },
    durationPercent: {
      spring: { ...unscaledDurations, hire: 75 },
      summer: { ...unscaledDurations, build: 75 },
      fall: unscaledDurations,
      winter: unscaledDurations,
    },
  },
}

describe('townSeasonAt', () => {
  it('answers the percents of the season that starts at the boundary', () => {
    expect(townSeasonAt(daysAfterEpoch(7), scaledSeasonSettings)).toEqual({
      kind: 'summer',
      year: 1,
      endsAt: daysAfterEpoch(14),
      productionPercent: { ...unscaled, food: 125 },
      durationPercent: { ...unscaledDurations, build: 75 },
    })
  })

  it('answers the percents of the season that ends at the boundary until it ends', () => {
    const lastInstantOfSpring = Instant.fromEpochMilliseconds(
      daysAfterEpoch(7).epochMilliseconds - 1,
    )

    expect(townSeasonAt(lastInstantOfSpring, scaledSeasonSettings)?.durationPercent).toEqual({
      ...unscaledDurations,
      hire: 75,
    })
  })

  it('answers no season before the epoch', () => {
    expect(townSeasonAt(daysAfterEpoch(-0.001), scaledSeasonSettings)).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { plainTownSettings } from '../testing/townCatalogOf'
import { Instant } from '../time/Instant'
import { seasonPercentsAt } from './seasonPercentsAt'
import type { TownSettings } from './TownSettings'

const MILLISECONDS_PER_DAY = 86_400_000

const epoch = plainTownSettings.seasons.epoch

const unscaled = { money: 100, food: 100, power: 100, material: 100 }

const halved = { money: 50, food: 50, power: 50, material: 50 }

const halvedDurations = { build: 50, study: 50, hire: 50, road: 50 }

const halvedSeasonSettings: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    productionPercent: { spring: halved, summer: halved, fall: halved, winter: halved },
    durationPercent: {
      spring: halvedDurations,
      summer: halvedDurations,
      fall: halvedDurations,
      winter: halvedDurations,
    },
  },
}

describe('seasonPercentsAt', () => {
  it('answers the percents of the season in force', () => {
    expect(seasonPercentsAt(epoch, halvedSeasonSettings)).toEqual({
      productionPercent: halved,
      durationPercent: halvedDurations,
    })
  })

  it('leaves every percent at 100 before the epoch', () => {
    const dayBeforeEpoch = Instant.fromEpochMilliseconds(
      epoch.epochMilliseconds - MILLISECONDS_PER_DAY,
    )

    expect(seasonPercentsAt(dayBeforeEpoch, halvedSeasonSettings)).toEqual({
      productionPercent: unscaled,
      durationPercent: { build: 100, study: 100, hire: 100, road: 100 },
    })
  })
})

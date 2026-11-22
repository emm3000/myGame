import { describe, expect, it } from 'vitest'
import { Instant } from '#time/Instant'
import type { TownSettings } from '../domain/TownSettings'
import { plainTownSettings } from '../testing/townCatalogOf'
import { lessonDurationSecondsAt } from './lessonDurationSecondsAt'

const MILLISECONDS_PER_DAY = 86_400_000

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY,
  )

const springDay = daysAfterEpoch(1)

const winterDay = daysAfterEpoch(22)

const winterStudyAtThreeQuarters: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    durationPercent: {
      ...plainTownSettings.seasons.durationPercent,
      winter: { build: 100, study: 75, hire: 100, road: 100 },
    },
  },
}

const lesson = { durationSeconds: 333 }

const schoolAtNinetyPercent = { lessonPercent: 90 }

describe('lessonDurationSecondsAt', () => {
  it("scales a lesson by the school's lesson percent and the season's study percent, rounding up", () => {
    expect(
      lessonDurationSecondsAt(lesson, schoolAtNinetyPercent, winterDay, winterStudyAtThreeQuarters),
    ).toBe(225)
  })

  it('reads the study percent of the season at the instant', () => {
    expect(
      lessonDurationSecondsAt(lesson, schoolAtNinetyPercent, springDay, winterStudyAtThreeQuarters),
    ).toBe(300)
  })
})

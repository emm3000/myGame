import { describe, expect, it } from 'vitest'
import { Instant } from '#time/Instant'
import type { TownSettings } from '../../domain/TownSettings'
import { plainTownSettings } from '../../testing/townCatalogOf'
import type { BuildingLevel } from './BuildingLevel'
import { levelWorkAt } from './levelWorkAt'

const MILLISECONDS_PER_DAY = 86_400_000

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY,
  )

const springDay = daysAfterEpoch(1)

const winterDay = daysAfterEpoch(22)

const winterBuildAtThreeQuarters: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    durationPercent: {
      ...plainTownSettings.seasons.durationPercent,
      winter: { build: 75, study: 100, hire: 100, road: 100 },
    },
  },
}

const secondFarm: BuildingLevel = {
  building: 'farm',
  level: 2,
  cost: { money: 120, food: 40, power: 0, material: 90 },
  durationSeconds: 333,
  people: 4,
  ratePerHour: 60,
}

describe('levelWorkAt', () => {
  it("works the level for its stored cost and its duration at the season's build percent, rounded up", () => {
    expect(levelWorkAt(secondFarm, winterDay, winterBuildAtThreeQuarters)).toEqual({
      building: 'farm',
      level: 2,
      cost: { money: 120, food: 40, power: 0, material: 90 },
      durationSeconds: 250,
    })
  })

  it('reads the build percent of the season at the instant', () => {
    expect(levelWorkAt(secondFarm, springDay, winterBuildAtThreeQuarters).durationSeconds).toBe(333)
  })
})

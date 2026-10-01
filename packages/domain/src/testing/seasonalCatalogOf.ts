import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { Instant } from '../time/Instant'
import { neutralSeasons } from './neutralSeasons'

const MILLISECONDS_PER_DAY = 86_400_000

const unscaled = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

export const seasonEpoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

export const daysAfterSeasonEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

export const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

export const seasonalCatalogOf = (catalog: BuildingCatalog): BuildingCatalog => ({
  ...catalog,
  fiefSettings: () => ({
    ...catalog.fiefSettings(),
    seasons: {
      ...neutralSeasons,
      epoch: seasonEpoch,
      multiplierPercent: {
        spring: { ...unscaled, food: 125 },
        summer: unscaled,
        autumn: { ...unscaled, gold: 125 },
        winter: { ...unscaled, food: 75 },
      },
      durationPercent: {
        ...neutralSeasons.durationPercent,
        autumn: { ...neutralSeasons.durationPercent.autumn, road: 75 },
      },
    },
  }),
})

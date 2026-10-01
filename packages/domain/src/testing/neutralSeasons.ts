import type { SeasonCalendar } from '../season/SeasonCalendar'
import { Instant } from '../time/Instant'

const unchangedRates = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const unchangedDurations = { build: 100, study: 100, train: 100, road: 100 }

export const neutralSeasons: SeasonCalendar = {
  epoch: Instant.fromEpochMilliseconds(0),
  daysPerSeason: 7,
  multiplierPercent: {
    spring: unchangedRates,
    summer: unchangedRates,
    autumn: unchangedRates,
    winter: unchangedRates,
  },
  durationPercent: {
    spring: unchangedDurations,
    summer: unchangedDurations,
    autumn: unchangedDurations,
    winter: unchangedDurations,
  },
}

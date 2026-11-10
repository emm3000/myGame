import type { Instant } from '../time/Instant'

export type SeasonDates = {
  readonly epoch: Instant
  readonly daysPerSeason: number
}

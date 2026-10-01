import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import type { SeasonKind } from './SeasonKind'

export type DurationPercent = {
  readonly build: number
  readonly study: number
  readonly train: number
  readonly road: number
}

export type SeasonCalendar = {
  readonly epoch: Instant
  readonly daysPerSeason: number
  readonly multiplierPercent: Readonly<Record<SeasonKind, Readonly<Record<ResourceKind, number>>>>
  readonly durationPercent: Readonly<Record<SeasonKind, DurationPercent>>
}

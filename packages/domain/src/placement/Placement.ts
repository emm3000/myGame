import type { Band } from '../learning/BandStart'
import type { WordId } from '../learning/Lesson'
import type { Instant } from '../time/Instant'

export type PlacementSample = {
  readonly band: Band
  readonly wordIds: ReadonlyArray<WordId>
}

export type PlacementScore = {
  readonly band: Band
  readonly score: number
  readonly takenAt: Instant
}

export type SkippedPlacement = {
  readonly kind: 'skipped'
  readonly skippedAt: Instant
}

export type TakenPlacement = {
  readonly kind: 'taken'
  readonly begunAt: Instant
  readonly samples: ReadonlyArray<PlacementSample>
  readonly scores: ReadonlyArray<PlacementScore>
}

export type Placement = SkippedPlacement | TakenPlacement

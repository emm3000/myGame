import type { WordId } from '../learning/Lesson'
import type { Instant } from '../time/Instant'

export type HoldoutCheckWeek = 8 | 24

export type HoldoutCheckSample = {
  readonly wordIds: ReadonlyArray<WordId>
  readonly heldOutWordIds: ReadonlyArray<WordId>
}

export type BegunHoldoutCheck = {
  readonly kind: 'begun'
  readonly week: HoldoutCheckWeek
  readonly begunAt: Instant
  readonly sample: HoldoutCheckSample
}

export type TakenHoldoutCheck = {
  readonly kind: 'taken'
  readonly week: HoldoutCheckWeek
  readonly begunAt: Instant
  readonly sample: HoldoutCheckSample
  readonly heldOutScore: number
  readonly practisedScore: number
  readonly takenAt: Instant
}

export type SkippedHoldoutCheck = {
  readonly kind: 'skipped'
  readonly week: HoldoutCheckWeek
  readonly skippedAt: Instant
}

export type HoldoutCheck = BegunHoldoutCheck | TakenHoldoutCheck | SkippedHoldoutCheck

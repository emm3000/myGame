import type { HoldoutCheck } from '#holdout/HoldoutCheck'
import type { Instant } from '#time/Instant'
import type { Band } from './Band'
import type { Headword } from './Headword'

export type BandStart = {
  readonly band: Band
  readonly startedAt: Instant
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly checks: ReadonlyArray<HoldoutCheck>
}

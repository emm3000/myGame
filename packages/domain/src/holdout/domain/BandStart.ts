import type { Band } from '#learning/curriculum/Band'
import type { Headword } from '#learning/curriculum/Headword'
import type { Instant } from '#time/Instant'
import type { HoldoutCheck } from './HoldoutCheck'

export type BandStart = {
  readonly band: Band
  readonly startedAt: Instant
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly checks: ReadonlyArray<HoldoutCheck>
}

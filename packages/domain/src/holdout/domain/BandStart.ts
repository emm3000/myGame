import type { Band } from '#learning/curriculum/domain/Band'
import type { Headword } from '#learning/curriculum/domain/Headword'
import type { Instant } from '#time/Instant'
import type { HoldoutCheck } from './HoldoutCheck'

export type BandStart = {
  readonly band: Band
  readonly startedAt: Instant
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly checks: ReadonlyArray<HoldoutCheck>
}

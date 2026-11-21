import type { Band } from '#learning/curriculum/Band'
import type { HoldoutCheckWeek } from './HoldoutCheckWeek'

export type DueHoldoutCheck = {
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

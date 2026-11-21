import type { Band } from '../learning/curriculum/BandStart'
import type { HoldoutCheckWeek } from './HoldoutCheckWeek'

export type DueHoldoutCheck = {
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

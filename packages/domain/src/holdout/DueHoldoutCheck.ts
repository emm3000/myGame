import type { Band } from '../learning/BandStart'
import type { HoldoutCheckWeek } from './HoldoutCheck'

export type DueHoldoutCheck = {
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

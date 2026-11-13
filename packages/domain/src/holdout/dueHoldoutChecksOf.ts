import type { BandStart } from '../learning/BandStart'
import type { Instant } from '../time/Instant'
import type { DueHoldoutCheck } from './DueHoldoutCheck'
import { dueWeeksOf } from './holdoutCheckWeeks'

export const dueHoldoutChecksOf = (
  starts: ReadonlyArray<BandStart>,
  now: Instant,
): ReadonlyArray<DueHoldoutCheck> =>
  starts.flatMap((start) => dueWeeksOf(start, now).map((week) => ({ band: start.band, week })))

import type { Instant } from '#time/Instant'
import type { BandStart } from './BandStart'
import { isWeekReached } from './holdoutCheckWeeks'

const BAND_START_WEEK = 0

export const hasBandStartedAt = (starts: ReadonlyArray<BandStart>, now: Instant): boolean =>
  starts.some((start) => isWeekReached(start, BAND_START_WEEK, now))

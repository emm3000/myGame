import type { BandStart } from '../learning/BandStart'
import type { HoldoutCheck, HoldoutCheckWeek } from './HoldoutCheck'

export const checkOfWeek = (
  { checks }: BandStart,
  week: HoldoutCheckWeek,
): HoldoutCheck | undefined => checks.find((check) => check.week === week)

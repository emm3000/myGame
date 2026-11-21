import type { BandStart } from '#learning/curriculum/BandStart'
import type { HoldoutCheck } from './HoldoutCheck'
import type { HoldoutCheckWeek } from './HoldoutCheckWeek'

export const checkOfWeek = (
  { checks }: BandStart,
  week: HoldoutCheckWeek,
): HoldoutCheck | undefined => checks.find((check) => check.week === week)

import type { BandStart } from '../learning/BandStart'
import type { Instant } from '../time/Instant'
import { checkOfWeek } from './checkOfWeek'
import type { HoldoutCheckWeek } from './HoldoutCheck'

const MILLISECONDS_PER_WEEK = 7 * 24 * 3_600_000

export const HOLDOUT_CHECK_WEEKS: ReadonlyArray<HoldoutCheckWeek> = [8, 24]

export const RELEASING_WEEK: HoldoutCheckWeek = 24

export const isWeekReached = ({ startedAt }: BandStart, week: number, now: Instant): boolean =>
  now.epochMilliseconds - startedAt.epochMilliseconds >= week * MILLISECONDS_PER_WEEK

const isClosed = (start: BandStart, week: HoldoutCheckWeek): boolean => {
  const stored = checkOfWeek(start, week)
  return stored !== undefined && stored.kind !== 'begun'
}

const laterWeekOf = (week: HoldoutCheckWeek): HoldoutCheckWeek | undefined =>
  HOLDOUT_CHECK_WEEKS.find((later) => later > week)

export const isHoldoutCheckDue = (
  start: BandStart,
  week: HoldoutCheckWeek,
  now: Instant,
): boolean => {
  const later = laterWeekOf(week)
  return (
    isWeekReached(start, week, now) &&
    (later === undefined || !isWeekReached(start, later, now)) &&
    !isClosed(start, week)
  )
}

export const dueWeeksOf = (start: BandStart, now: Instant): ReadonlyArray<HoldoutCheckWeek> =>
  HOLDOUT_CHECK_WEEKS.filter((week) => isHoldoutCheckDue(start, week, now))

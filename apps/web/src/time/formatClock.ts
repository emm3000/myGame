import { copy } from '../copy'
import { formatLocalDay } from './formatLocalDay'
import { formatLocalTime } from './formatLocalTime'

const dayOf = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate()).getTime()

const dayAfter = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate() + 1).getTime()

export function formatClock(instant: Date, now: Date): string {
  const time = formatLocalTime(instant)
  if (dayOf(instant) === dayOf(now)) {
    return time
  }
  if (dayOf(instant) === dayAfter(now)) {
    return copy.status.tomorrow(time)
  }
  return `${formatLocalDay(instant)} ${time}`
}

import type { ChromeCatalog } from '../copy/PlayerCopy'
import { formatLocalDay } from './formatLocalDay'
import { formatLocalTime } from './formatLocalTime'

const dayOf = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate()).getTime()

const dayAfter = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate() + 1).getTime()

export function formatClock(catalog: ChromeCatalog, instant: Date, now: Date): string {
  const time = formatLocalTime(instant)
  if (dayOf(instant) === dayOf(now)) {
    return time
  }
  if (dayOf(instant) === dayAfter(now)) {
    return catalog.statusTomorrow({ time })
  }
  return `${formatLocalDay(catalog, instant)} ${time}`
}

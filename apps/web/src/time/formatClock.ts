import { copy } from '../copy'

const monthFormat = new Intl.DateTimeFormat('es', { month: 'short' })

const twoDigits = (value: number): string => String(value).padStart(2, '0')

const dayOf = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate()).getTime()

const dayAfter = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate() + 1).getTime()

export function formatClock(instant: Date, now: Date): string {
  const time = `${twoDigits(instant.getHours())}:${twoDigits(instant.getMinutes())}`
  if (dayOf(instant) === dayOf(now)) {
    return time
  }
  if (dayOf(instant) === dayAfter(now)) {
    return copy.status.tomorrow(time)
  }
  return `${instant.getDate()} ${monthFormat.format(instant)} ${time}`
}

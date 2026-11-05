import { timeToday } from '@mygame/catalog'
import { formatLocalDay } from './formatLocalDay'
import { formatLocalTime } from './formatLocalTime'

const isSameDay = (instant: Date, now: Date): boolean =>
  instant.getFullYear() === now.getFullYear() &&
  instant.getMonth() === now.getMonth() &&
  instant.getDate() === now.getDate()

export function formatInstant(instant: Date, now: Date): string {
  const time = formatLocalTime(instant)
  if (isSameDay(instant, now)) {
    return timeToday({ time })
  }
  const day = formatLocalDay(instant)
  const date = instant.getFullYear() === now.getFullYear() ? day : `${day} ${instant.getFullYear()}`
  return `${date}, ${time}`
}

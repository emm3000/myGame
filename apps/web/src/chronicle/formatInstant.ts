import { copy } from '../copy'

const monthFormat = new Intl.DateTimeFormat('es', { month: 'short' })

const twoDigits = (value: number): string => String(value).padStart(2, '0')

const isSameDay = (instant: Date, now: Date): boolean =>
  instant.getFullYear() === now.getFullYear() &&
  instant.getMonth() === now.getMonth() &&
  instant.getDate() === now.getDate()

export function formatInstant(instant: Date, now: Date): string {
  const time = `${twoDigits(instant.getHours())}:${twoDigits(instant.getMinutes())}`
  if (isSameDay(instant, now)) {
    return copy.chronicle.today(time)
  }
  const day = `${instant.getDate()} ${monthFormat.format(instant)}`
  const date = instant.getFullYear() === now.getFullYear() ? day : `${day} ${instant.getFullYear()}`
  return `${date}, ${time}`
}

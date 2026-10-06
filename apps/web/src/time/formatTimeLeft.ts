import { formatDuration } from '../design-system/formatDuration'

const secondsPerMinute = 60
const secondsPerHour = 3600

export function formatTimeLeft(seconds: number): string {
  const whole = Math.ceil(Math.max(0, seconds))
  if (whole < secondsPerMinute) {
    return `0:${String(whole).padStart(2, '0')}`
  }
  return whole < secondsPerHour
    ? `${Math.floor(whole / secondsPerMinute)} min`
    : formatDuration(whole)
}

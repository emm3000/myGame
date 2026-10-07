const twoDigits = (value: number): string => String(value).padStart(2, '0')

export function formatLocalTime(instant: Date): string {
  return `${twoDigits(instant.getHours())}:${twoDigits(instant.getMinutes())}`
}

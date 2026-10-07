const monthFormat = new Intl.DateTimeFormat('es', { month: 'short' })

export function formatLocalDay(instant: Date): string {
  return `${instant.getDate()} ${monthFormat.format(instant)}`
}

import type { FixedLinePieces } from '../copy/PlayerCopy'

export function formatLocalDay(catalog: FixedLinePieces, instant: Date): string {
  const month = new Intl.DateTimeFormat(catalog.locale, { month: 'short' }).format(instant)
  return `${instant.getDate()} ${month}`
}

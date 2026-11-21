import type { ChromeCatalog } from '../copy/PlayerCopy'

export function formatLocalDay(catalog: ChromeCatalog, instant: Date): string {
  const month = new Intl.DateTimeFormat(catalog.locale, { month: 'short' }).format(instant)
  return `${instant.getDate()} ${month}`
}

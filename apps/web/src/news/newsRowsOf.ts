import type { TownNewsItem } from '@mygame/contracts'
import { type NewsRow, newsRowOf } from './newsRowOf'

const newestFirst = (left: TownNewsItem, right: TownNewsItem): number =>
  Date.parse(right.occurredAt) - Date.parse(left.occurredAt)

export function newsRowsOf(items: ReadonlyArray<TownNewsItem>, now: Date): ReadonlyArray<NewsRow> {
  return [...items].sort(newestFirst).map((item) => newsRowOf(item, now))
}

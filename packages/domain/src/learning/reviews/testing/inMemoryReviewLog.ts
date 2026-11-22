import { ok } from '#Result'
import type { ReviewLog } from '../domain/ReviewLog'
import type { ReviewLogEntry } from '../domain/ReviewLogEntry'

export type InMemoryReviewLog = ReviewLog & {
  entries(): ReadonlyArray<ReviewLogEntry>
}

export const inMemoryReviewLog = (): InMemoryReviewLog => {
  const appended: Array<ReviewLogEntry> = []
  return {
    entries: () => [...appended],
    append: async (entry) => {
      appended.push(entry)
      return ok(undefined)
    },
  }
}

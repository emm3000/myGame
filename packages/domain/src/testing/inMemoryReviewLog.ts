import type { ReviewLogEntry } from '../learning/ReviewLogEntry'
import type { ReviewLog } from '../ports/ReviewLog'
import { ok } from '../Result'

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

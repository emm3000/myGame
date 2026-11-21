import { ok } from '#Result'
import type { ReviewLog } from '../ports/ReviewLog'
import type { ReviewLogEntry } from '../ReviewLogEntry'

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

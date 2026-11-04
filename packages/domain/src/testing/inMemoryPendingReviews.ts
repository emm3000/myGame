import type { WordId } from '../learning/Lesson'
import type { PendingReview } from '../learning/PendingReview'
import type { PlayerId } from '../player/PlayerId'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import { ok } from '../Result'

export const inMemoryPendingReviews = (): PendingReviewRepository => {
  const keyOf = (playerId: PlayerId, wordId: WordId): string => `${playerId}/${wordId}`
  const pending = new Map<string, PendingReview>()
  return {
    pendingReviewOf: async (playerId, wordId) => pending.get(keyOf(playerId, wordId)),
    save: async (playerId, wordId, review) => {
      pending.set(keyOf(playerId, wordId), review)
      return ok(undefined)
    },
    delete: async (playerId, wordId) => {
      pending.delete(keyOf(playerId, wordId))
      return ok(undefined)
    },
  }
}

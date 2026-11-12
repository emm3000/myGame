import type { WordId } from '../learning/Lesson'
import type { PendingReview } from '../learning/PendingReview'
import type { PlayerId } from '../player/PlayerId'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import { ok } from '../Result'

export const inMemoryPendingReviews = (): PendingReviewRepository => {
  const pendingByPlayer = new Map<PlayerId, Map<WordId, PendingReview>>()
  const pendingOf = (playerId: PlayerId): Map<WordId, PendingReview> => {
    const held = pendingByPlayer.get(playerId) ?? new Map<WordId, PendingReview>()
    pendingByPlayer.set(playerId, held)
    return held
  }
  const store = (playerId: PlayerId, wordId: WordId, review: PendingReview): void => {
    const shownFrame = pendingOf(playerId).get(wordId)?.shownFrame ?? review.shownFrame
    pendingOf(playerId).set(wordId, { ...review, shownFrame })
  }
  return {
    pendingReviewOf: async (playerId, wordId) => pendingOf(playerId).get(wordId),
    pendingReviewsOf: async (playerId) => new Map(pendingOf(playerId)),
    save: async (playerId, wordId, review) => {
      store(playerId, wordId, review)
      return ok(undefined)
    },
    saveAll: async (playerId, reviews) => {
      for (const [wordId, review] of reviews) {
        store(playerId, wordId, review)
      }
      return ok(undefined)
    },
    delete: async (playerId, wordId) => {
      pendingOf(playerId).delete(wordId)
      return ok(undefined)
    },
  }
}

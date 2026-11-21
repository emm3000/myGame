import {
  type DomainError,
  ok,
  type PendingReview,
  type PendingReviewRepository,
  type PlayerId,
  type Result,
  type WordId,
} from '@mygame/domain'

export class MemoryPendingReviewRepository implements PendingReviewRepository {
  private readonly pending = new Map<PlayerId, Map<WordId, PendingReview>>()

  async pendingReviewOf(playerId: PlayerId, wordId: WordId): Promise<PendingReview | undefined> {
    return this.pending.get(playerId)?.get(wordId)
  }

  async pendingReviewsOf(playerId: PlayerId): Promise<ReadonlyMap<WordId, PendingReview>> {
    return new Map(this.pending.get(playerId))
  }

  async save(
    playerId: PlayerId,
    wordId: WordId,
    pending: PendingReview,
  ): Promise<Result<void, DomainError>> {
    return this.saveAll(playerId, new Map([[wordId, pending]]))
  }

  async saveAll(
    playerId: PlayerId,
    pending: ReadonlyMap<WordId, PendingReview>,
  ): Promise<Result<void, DomainError>> {
    const stored = this.pending.get(playerId) ?? new Map<WordId, PendingReview>()
    for (const [wordId, review] of pending) {
      const shownFrame = stored.get(wordId)?.shownFrame ?? review.shownFrame
      stored.set(wordId, { ...review, shownFrame })
    }
    this.pending.set(playerId, stored)
    return ok(undefined)
  }

  async delete(playerId: PlayerId, wordId: WordId): Promise<Result<void, DomainError>> {
    this.pending.get(playerId)?.delete(wordId)
    return ok(undefined)
  }
}

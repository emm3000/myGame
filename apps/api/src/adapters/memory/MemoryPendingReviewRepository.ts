import {
  type DomainError,
  ok,
  type PendingReview,
  type PendingReviewRepository,
  type PlayerId,
  type Result,
  type WordId,
} from '@mygame/domain'

const keyOf = (playerId: PlayerId, wordId: WordId): string => JSON.stringify([playerId, wordId])

export class MemoryPendingReviewRepository implements PendingReviewRepository {
  private readonly pending = new Map<string, PendingReview>()

  async pendingReviewOf(playerId: PlayerId, wordId: WordId): Promise<PendingReview | undefined> {
    return this.pending.get(keyOf(playerId, wordId))
  }

  async save(
    playerId: PlayerId,
    wordId: WordId,
    pending: PendingReview,
  ): Promise<Result<void, DomainError>> {
    this.pending.set(keyOf(playerId, wordId), pending)
    return ok(undefined)
  }

  async delete(playerId: PlayerId, wordId: WordId): Promise<Result<void, DomainError>> {
    this.pending.delete(keyOf(playerId, wordId))
    return ok(undefined)
  }
}

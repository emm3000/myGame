import type { DomainError } from '../DomainError'
import type { WordId } from '../learning/Lesson'
import type { PendingReview } from '../learning/PendingReview'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'

export interface PendingReviewRepository {
  pendingReviewOf(playerId: PlayerId, wordId: WordId): Promise<PendingReview | undefined>
  save(
    playerId: PlayerId,
    wordId: WordId,
    pending: PendingReview,
  ): Promise<Result<void, DomainError>>
  delete(playerId: PlayerId, wordId: WordId): Promise<Result<void, DomainError>>
}

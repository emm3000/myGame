import {
  type DomainError,
  ok,
  type PendingReview,
  type PendingReviewRepository,
  type PlayerId,
  type Result,
  type WordId,
} from '@mygame/domain'
import { and, eq } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { pendingReviews } from './schema'

export class DrizzlePendingReviewRepository implements PendingReviewRepository {
  constructor(private readonly database: PostgresSession) {}

  async pendingReviewOf(playerId: PlayerId, wordId: WordId): Promise<PendingReview | undefined> {
    const [row] = await this.database
      .select({
        hintShown: pendingReviews.hintShown,
        nearMissAnswer: pendingReviews.nearMissAnswer,
      })
      .from(pendingReviews)
      .where(and(eq(pendingReviews.playerId, playerId), eq(pendingReviews.wordId, wordId)))
    return row
  }

  async save(
    playerId: PlayerId,
    wordId: WordId,
    { hintShown, nearMissAnswer }: PendingReview,
  ): Promise<Result<void, DomainError>> {
    await this.database
      .insert(pendingReviews)
      .values({ playerId, wordId, hintShown, nearMissAnswer })
      .onConflictDoUpdate({
        target: [pendingReviews.playerId, pendingReviews.wordId],
        set: { hintShown, nearMissAnswer },
      })
    return ok(undefined)
  }

  async delete(playerId: PlayerId, wordId: WordId): Promise<Result<void, DomainError>> {
    await this.database
      .delete(pendingReviews)
      .where(and(eq(pendingReviews.playerId, playerId), eq(pendingReviews.wordId, wordId)))
    return ok(undefined)
  }
}

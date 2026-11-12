import {
  type DomainError,
  ok,
  type PendingReview,
  type PendingReviewRepository,
  type PlayerId,
  type Result,
  type WordId,
} from '@mygame/domain'
import { and, eq, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { pendingReviews } from './schema'

const pendingColumns = {
  hintShown: pendingReviews.hintShown,
  nearMissAnswer: pendingReviews.nearMissAnswer,
  shownFrame: pendingReviews.shownFrame,
}

export class DrizzlePendingReviewRepository implements PendingReviewRepository {
  constructor(private readonly database: PostgresSession) {}

  async pendingReviewOf(playerId: PlayerId, wordId: WordId): Promise<PendingReview | undefined> {
    const [row] = await this.database
      .select(pendingColumns)
      .from(pendingReviews)
      .where(and(eq(pendingReviews.playerId, playerId), eq(pendingReviews.wordId, wordId)))
    return row
  }

  async pendingReviewsOf(playerId: PlayerId): Promise<ReadonlyMap<WordId, PendingReview>> {
    const rows = await this.database
      .select({ wordId: pendingReviews.wordId, ...pendingColumns })
      .from(pendingReviews)
      .where(eq(pendingReviews.playerId, playerId))
    return new Map(rows.map(({ wordId, ...pending }) => [wordId, pending]))
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
    if (pending.size === 0) {
      return ok(undefined)
    }
    await this.database
      .insert(pendingReviews)
      .values([...pending].map(([wordId, review]) => ({ playerId, wordId, ...review })))
      .onConflictDoUpdate({
        target: [pendingReviews.playerId, pendingReviews.wordId],
        set: {
          hintShown: sql`excluded.hint_shown`,
          nearMissAnswer: sql`excluded.near_miss_answer`,
          shownFrame: sql`coalesce(pending_reviews.shown_frame, excluded.shown_frame)`,
        },
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

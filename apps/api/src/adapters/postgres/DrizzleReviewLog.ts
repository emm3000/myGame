import {
  type DomainError,
  ok,
  type Result,
  type ReviewLog,
  type ReviewLogEntry,
} from '@mygame/domain'
import type { PostgresSession } from './connectPostgres'
import { reviewLog } from './schema'
import { cardColumnsOf } from './storedMemoryCards'

const recalledColumnsOf = (entry: ReviewLogEntry) => {
  const after = cardColumnsOf(entry.after)
  const { stability, difficulty, lastReviewAt, lastRating } = after
  if (stability === null || difficulty === null || lastReviewAt === null || lastRating === null) {
    throw new Error(`The review of ${entry.wordId} logs a card it never reviewed`)
  }
  return { ...after, stability, difficulty, lastReviewAt, lastRating }
}

export class DrizzleReviewLog implements ReviewLog {
  constructor(private readonly database: PostgresSession) {}

  async append(entry: ReviewLogEntry): Promise<Result<void, DomainError>> {
    const before = cardColumnsOf(entry.before)
    const after = recalledColumnsOf(entry)
    await this.database.insert(reviewLog).values({
      playerId: entry.playerId,
      wordId: entry.wordId,
      reviewedAt: new Date(entry.reviewedAt.epochMilliseconds),
      format: entry.format,
      answer: entry.answer,
      nearMissAnswer: entry.nearMissAnswer,
      hintShown: entry.hintShown,
      rating: entry.rating,
      elapsedDays: entry.elapsedDays,
      shownFrame: entry.shownFrame,
      beforeState: before.state,
      beforeStep: before.step,
      beforeStability: before.stability,
      beforeDifficulty: before.difficulty,
      beforeLastReviewAt: before.lastReviewAt,
      beforeLastRating: before.lastRating,
      beforeEnteredAt: before.enteredAt,
      beforeRetainedAt: before.retainedAt,
      afterState: after.state,
      afterStep: after.step,
      afterStability: after.stability,
      afterDifficulty: after.difficulty,
      afterLastReviewAt: after.lastReviewAt,
      afterLastRating: after.lastRating,
      afterEnteredAt: after.enteredAt,
      afterRetainedAt: after.retainedAt,
    })
    return ok(undefined)
  }
}

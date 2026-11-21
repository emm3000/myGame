import type { MemoryCard } from '../../memory/MemoryCard'
import type { MemoryRating } from '../../memory/MemoryRating'
import { wholeDaysBetween } from '../../memory/wholeDaysBetween'
import type { Instant } from '../../time/Instant'
import type { AnswerReviewCommand } from './AnswerReviewCommand'
import type { DueReview } from './admitDueReview'
import { freshPendingReview } from './freshPendingReview'
import type { PendingReview } from './PendingReview'
import { reviewFormatOf } from './ReviewFormat'
import type { ReviewLogEntry } from './ReviewLogEntry'

export const reviewLogEntryOf = (
  command: AnswerReviewCommand,
  review: DueReview,
  pending: PendingReview | undefined,
  rating: MemoryRating,
  after: MemoryCard,
  now: Instant,
): ReviewLogEntry => {
  const before = review.held.card.stored
  const { nearMissAnswer, hintShown, shownFrame } = pending ?? freshPendingReview
  return {
    playerId: command.playerId,
    wordId: command.wordId,
    reviewedAt: now,
    format: reviewFormatOf(review.held.card),
    answer: command.answer,
    nearMissAnswer,
    hintShown,
    rating,
    elapsedDays: before.lastReviewAt === null ? null : wholeDaysBetween(before.lastReviewAt, now),
    shownFrame,
    before,
    after: after.stored,
  }
}

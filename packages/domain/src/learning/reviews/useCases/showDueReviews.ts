import type { DomainError } from '../../../DomainError'
import type { MemoryTerms } from '../../../memory/MemoryTerms'
import type { PlayerId } from '../../../player/PlayerId'
import type { Clock } from '../../../ports/Clock'
import { ok, type Result } from '../../../Result'
import type { LessonCatalog } from '../../curriculum/ports/LessonCatalog'
import type { Stage } from '../../curriculum/stageOf'
import { shownFrameOf } from '../../frames/shownFrameOf'
import type { HeldCard } from '../../HeldCard'
import type { WordId } from '../../Lesson'
import { type DueCard, dueCardsAt } from '../dueCardsAt'
import { freshPendingReview } from '../freshPendingReview'
import type { PendingReview } from '../PendingReview'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import { type TaughtWord, taughtWordOf } from '../taughtWordOf'

export type ShowDueReviewsCommand = {
  readonly playerId: PlayerId
  readonly cards: ReadonlyArray<HeldCard>
  readonly stage: Stage
}

export type ShowDueReviewsDependencies = {
  readonly pendingReviews: Pick<PendingReviewRepository, 'pendingReviewsOf' | 'saveAll'>
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'>
  readonly clock: Clock
  readonly terms: MemoryTerms
}

export type ShownReview = TaughtWord & {
  readonly due: DueCard
  readonly shownFrame: string
}

const shownReviewOf = (
  due: DueCard,
  pending: PendingReview | undefined,
  stage: Stage,
  lessons: Pick<LessonCatalog, 'lessonOfWord'>,
): Result<ShownReview, DomainError> => {
  const taught = taughtWordOf(due.wordId, lessons.lessonOfWord(due.wordId))
  if (!taught.ok) {
    return taught
  }
  const shownFrame = pending?.shownFrame ?? shownFrameOf(taught.value.word, due.card, stage)
  return ok({ ...taught.value, due, shownFrame })
}

const firstShownOf = (
  shown: ReadonlyArray<ShownReview>,
  pending: ReadonlyMap<WordId, PendingReview>,
): ReadonlyMap<WordId, PendingReview> =>
  new Map(
    shown
      .map(({ word, shownFrame }) => ({
        wordId: word.id,
        shownFrame,
        waiting: pending.get(word.id) ?? freshPendingReview,
      }))
      .filter(({ waiting }) => waiting.shownFrame === null)
      .map(({ wordId, shownFrame, waiting }) => [wordId, { ...waiting, shownFrame }]),
  )

export const showDueReviews = async (
  { playerId, cards, stage }: ShowDueReviewsCommand,
  { pendingReviews, lessons, clock, terms }: ShowDueReviewsDependencies,
): Promise<Result<ReadonlyArray<ShownReview>, DomainError>> => {
  const due = dueCardsAt(cards, clock.now(), terms)
  if (!due.ok) {
    return due
  }
  const pending = await pendingReviews.pendingReviewsOf(playerId)
  const shown: Array<ShownReview> = []
  for (const dueCard of due.value) {
    const review = shownReviewOf(dueCard, pending.get(dueCard.wordId), stage, lessons)
    if (!review.ok) {
      return review
    }
    shown.push(review.value)
  }
  const firstShown = firstShownOf(shown, pending)
  if (firstShown.size === 0) {
    return ok(shown)
  }
  const saved = await pendingReviews.saveAll(playerId, firstShown)
  return saved.ok ? ok(shown) : saved
}

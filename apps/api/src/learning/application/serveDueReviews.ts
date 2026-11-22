import type { LessonLibrary } from '@mygame/domain'
import {
  type Clock,
  type DomainError,
  type FrameLearner,
  heldCardsOf,
  type Instant,
  type LessonId,
  type MemoryTerms,
  nextDueAtOf,
  ok,
  type PendingReviewRepository,
  type PlayerId,
  type Result,
  type ReviewPrompt,
  readFirstOf,
  reviewPromptOf,
  type ShownReview,
  showDueReviews,
  stageOf,
  type WordId,
} from '@mygame/domain'
import type { LearnerStores } from './ports/LearnerStores'
import { readLearner } from './readLearner'

export type ReviewTerms = {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

export type PromptedReview = {
  readonly wordId: WordId
  readonly lessonId: LessonId
  readonly dueAt: Instant
  readonly prompt: ReviewPrompt
}

export type DueReviews = {
  readonly due: ReadonlyArray<PromptedReview>
  readonly readFirst: ReadonlyArray<LessonId>
  readonly nextDueAt: Instant | null
  readonly readAt: Instant
}

const promptedReviewOf = (
  { lesson, word, due, shownFrame }: ShownReview,
  learner: FrameLearner,
): PromptedReview => ({
  wordId: word.id,
  lessonId: lesson.id,
  dueAt: due.dueAt,
  prompt: reviewPromptOf({ lesson, word, card: due.card, shownFrame }, learner),
})

export const serveDueReviews = async (
  playerId: PlayerId,
  stores: LearnerStores & { readonly pendingReviews: PendingReviewRepository },
  clock: Clock,
  { lessons, memoryTerms }: ReviewTerms,
): Promise<Result<DueReviews, DomainError>> => {
  const learner = await readLearner(playerId, stores)
  if (!learner.ok) {
    return learner
  }
  const { cards, placedOutBands, scaffold } = learner.value
  const shown = await showDueReviews(
    { playerId, cards, stage: stageOf(lessons.lessons(), cards, placedOutBands, lessons) },
    { pendingReviews: stores.pendingReviews, lessons, clock, terms: memoryTerms },
  )
  if (!shown.ok) {
    return shown
  }
  const readAt = clock.now()
  const nextDueAt = nextDueAtOf(cards, readAt, memoryTerms)
  if (!nextDueAt.ok) {
    return nextDueAt
  }
  const frameLearner = { cards: heldCardsOf(cards), placedOutBands, scaffold, lessons }
  return ok({
    due: shown.value.map((review) => promptedReviewOf(review, frameLearner)),
    readFirst: readFirstOf(
      lessons.lessons(),
      shown.value.map(({ due }) => due),
    ),
    nextDueAt: nextDueAt.value,
    readAt,
  })
}

import type { DueReview, Reviews } from '@mygame/contracts'
import {
  type Clock,
  type DomainError,
  dueInstantOf,
  type FrameReader,
  type HeldCard,
  heldCardsOf,
  type Instant,
  type LessonId,
  type MemoryTerms,
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
import type { LessonLibrary } from '../../content/application/ports/LessonLibrary'
import { isoOf } from '../../platform/infrastructure/http/isoOf'
import { type LearnerStores, learnerOf } from './readLearner'

export type ReviewTerms = {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

type PromptedReview = {
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
  reader: FrameReader,
): PromptedReview => ({
  wordId: word.id,
  lessonId: lesson.id,
  dueAt: due.dueAt,
  prompt: reviewPromptOf({ lesson, word, card: due.card, shownFrame }, reader),
})

const dueReviewOf = ({ wordId, lessonId, dueAt, prompt }: PromptedReview): DueReview => {
  const asked = { wordId, lessonId, dueAt: isoOf(dueAt) }
  if (prompt.mode === 'recall') {
    return { ...asked, ...prompt, gappedFrame: [...prompt.gappedFrame] }
  }
  return { ...asked, ...prompt, frame: [...prompt.frame], choices: [...prompt.choices] }
}

export const nextDueAtOf = (
  cards: ReadonlyArray<HeldCard>,
  readAt: Instant,
  terms: MemoryTerms,
): Result<Instant | null, DomainError> => {
  let next: Instant | null = null
  for (const { card } of cards) {
    const dueAt = dueInstantOf(card, terms)
    if (!dueAt.ok) {
      return dueAt
    }
    const isLater = dueAt.value.epochMilliseconds > readAt.epochMilliseconds
    if (isLater && (next === null || dueAt.value.epochMilliseconds < next.epochMilliseconds)) {
      next = dueAt.value
    }
  }
  return ok(next)
}

export const serveDueReviews = async (
  playerId: PlayerId,
  stores: LearnerStores & { readonly pendingReviews: PendingReviewRepository },
  clock: Clock,
  { lessons, memoryTerms }: ReviewTerms,
): Promise<Result<DueReviews, DomainError>> => {
  const learner = await learnerOf(playerId, stores)
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
  const reader = { cards: heldCardsOf(cards), placedOutBands, scaffold, lessons }
  return ok({
    due: shown.value.map((review) => promptedReviewOf(review, reader)),
    readFirst: readFirstOf(
      lessons.lessons(),
      shown.value.map(({ due }) => due),
    ),
    nextDueAt: nextDueAt.value,
    readAt,
  })
}

export const presentReviews = ({ due, readFirst, nextDueAt, readAt }: DueReviews): Reviews => ({
  due: due.map(dueReviewOf),
  readFirst: [...readFirst],
  nextDueAt: nextDueAt === null ? null : isoOf(nextDueAt),
  readAt: isoOf(readAt),
})

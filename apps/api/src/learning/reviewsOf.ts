import type { DueReview, Reviews } from '@mygame/contracts'
import {
  type DomainError,
  type DueCard,
  dueCardsAt,
  dueInstantOf,
  err,
  type HeldCard,
  type Instant,
  type MemoryTerms,
  ok,
  type Result,
  recognitionChoicesOf,
  reviewFormatOf,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { LessonLibrary } from './LessonLibrary'

export type ReviewTerms = {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

const dueReviewOf = (
  due: DueCard,
  cards: ReadonlyArray<HeldCard>,
  lessons: LessonLibrary,
): Result<DueReview, DomainError> => {
  const lesson = lessons.lessonOfWord(due.wordId)
  const word = lesson?.words.find(({ id }) => id === due.wordId)
  if (lesson === undefined || word === undefined) {
    return err({ kind: 'UnknownWord', wordId: due.wordId })
  }
  const asked = { wordId: word.id, lessonId: lesson.id, dueAt: isoOf(due.dueAt) }
  if (reviewFormatOf(due.card) === 'recall') {
    return ok({ ...asked, mode: 'recall', gloss: word.gloss, gappedFrame: word.gappedFrame })
  }
  return ok({
    ...asked,
    mode: 'recognition',
    word: word.acceptedForms[0],
    frame: word.frame,
    choices: recognitionChoicesOf(word.id, lesson, due.card, cards).flatMap(
      ({ choiceId, wordId }) =>
        lesson.words.filter(({ id }) => id === wordId).map(({ gloss }) => ({ choiceId, gloss })),
    ),
  })
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

export const reviewsOf = (
  cards: ReadonlyArray<HeldCard>,
  readAt: Instant,
  { lessons, memoryTerms }: ReviewTerms,
): Result<Reviews, DomainError> => {
  const dueCards = dueCardsAt(cards, readAt, memoryTerms)
  if (!dueCards.ok) {
    return dueCards
  }
  const due: Array<DueReview> = []
  for (const dueCard of dueCards.value) {
    const review = dueReviewOf(dueCard, cards, lessons)
    if (!review.ok) {
      return review
    }
    due.push(review.value)
  }
  const nextDueAt = nextDueAtOf(cards, readAt, memoryTerms)
  if (!nextDueAt.ok) {
    return nextDueAt
  }
  return ok({
    due,
    nextDueAt: nextDueAt.value === null ? null : isoOf(nextDueAt.value),
    readAt: isoOf(readAt),
  })
}

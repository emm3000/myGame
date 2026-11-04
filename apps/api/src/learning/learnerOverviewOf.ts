import type { FiefOverview } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type DomainError,
  type DueCard,
  deriveStudyDurationSeconds,
  dueCardsAt,
  dueInstantOf,
  durationPercentAt,
  err,
  type Fief,
  type HeldCard,
  type Instant,
  isWordRetained,
  type MemoryTerms,
  ok,
  type Result,
  recognitionChoicesOf,
  reviewFormatOf,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { LessonLibrary, ShelvedLesson } from './LessonLibrary'

export type LearnerTerms = {
  readonly buildingCatalog: BuildingCatalog
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

type LearnerOverview = Pick<FiefOverview, 'lessons' | 'skills' | 'reviews'>

type DueReview = FiefOverview['reviews']['due'][number]

const lessonStateOf = (
  lesson: ShelvedLesson,
  fief: Fief,
  cards: ReadonlyArray<HeldCard>,
  catalog: BuildingCatalog,
): FiefOverview['lessons'][number] => {
  const words = lesson.words.map(({ id }) => {
    const held = cards.find(({ wordId }) => wordId === id)
    return { wordId: id, held }
  })
  return {
    id: lesson.id,
    theme: lesson.theme,
    durationSeconds: deriveStudyDurationSeconds(
      lesson.durationSeconds,
      fief.buildingLevels.library,
      durationPercentAt(fief.storedAt, catalog.fiefSettings()).study,
    ),
    requiredLibraryLevel: lesson.requiredLibraryLevel,
    skill: { ...lesson.skill },
    isStudied: words.some(({ held }) => held !== undefined),
    words: words.map(({ wordId, held }) => ({
      wordId,
      isRetained: held !== undefined && isWordRetained(held),
    })),
  }
}

const dueReviewOf = (due: DueCard, lessons: LessonLibrary): Result<DueReview, DomainError> => {
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
    choices: recognitionChoicesOf(word.id, lesson, due.card).flatMap((wordId) =>
      lesson.words
        .filter(({ id }) => id === wordId)
        .map(({ id, gloss }) => ({ wordId: id, gloss })),
    ),
  })
}

const nextDueAtOf = (
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

const reviewsOf = (
  cards: ReadonlyArray<HeldCard>,
  readAt: Instant,
  { lessons, memoryTerms }: LearnerTerms,
): Result<FiefOverview['reviews'], DomainError> => {
  const dueCards = dueCardsAt(cards, readAt, memoryTerms)
  if (!dueCards.ok) {
    return dueCards
  }
  const due: Array<DueReview> = []
  for (const dueCard of dueCards.value) {
    const review = dueReviewOf(dueCard, lessons)
    if (!review.ok) {
      return review
    }
    due.push(review.value)
  }
  const nextDueAt = nextDueAtOf(cards, readAt, memoryTerms)
  if (!nextDueAt.ok) {
    return nextDueAt
  }
  return ok({ due, nextDueAt: nextDueAt.value === null ? null : isoOf(nextDueAt.value) })
}

export const learnerOverviewOf = (
  fief: Fief,
  cards: ReadonlyArray<HeldCard>,
  terms: LearnerTerms,
): Result<LearnerOverview, DomainError> => {
  const reviews = reviewsOf(cards, fief.storedAt, terms)
  if (!reviews.ok) {
    return reviews
  }
  return ok({
    lessons: terms.lessons
      .lessons()
      .map((lesson) => lessonStateOf(lesson, fief, cards, terms.buildingCatalog)),
    skills: fief.skills.map(({ lessonId, resource, ratePercent, earnedAt }) => ({
      lessonId,
      resource,
      ratePercent,
      earnedAt: isoOf(earnedAt),
    })),
    reviews: reviews.value,
  })
}

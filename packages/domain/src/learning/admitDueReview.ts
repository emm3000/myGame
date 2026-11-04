import type { DomainError } from '../DomainError'
import { dueInstantOf } from '../memory/dueInstantOf'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { Lesson, LessonWord, WordId } from './Lesson'

export type DueReview = {
  readonly lesson: Lesson
  readonly word: LessonWord
  readonly held: HeldCard
}

export const admitDueReview = (
  wordId: WordId,
  lesson: Lesson | undefined,
  cards: ReadonlyArray<HeldCard>,
  now: Instant,
  terms: MemoryTerms,
): Result<DueReview, DomainError> => {
  const word = lesson?.words.find(({ id }) => id === wordId)
  if (lesson === undefined || word === undefined) {
    return err({ kind: 'UnknownWord', wordId })
  }
  const held = cards.find((card) => card.wordId === wordId)
  if (held === undefined) {
    return err({ kind: 'WordNotHeld', wordId })
  }
  const dueAt = dueInstantOf(held.card, terms)
  if (!dueAt.ok) {
    return dueAt
  }
  if (dueAt.value.epochMilliseconds > now.epochMilliseconds) {
    return err({ kind: 'ReviewNotDue', wordId, dueAt: dueAt.value })
  }
  return ok({ lesson, word, held })
}

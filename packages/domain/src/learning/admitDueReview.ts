import type { DomainError } from '../DomainError'
import { dueInstantOf } from '../memory/dueInstantOf'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { Lesson, WordId } from './Lesson'
import { type TaughtWord, taughtWordOf } from './taughtWordOf'

export type DueReview = TaughtWord & {
  readonly held: HeldCard
}

export const admitDueReview = (
  wordId: WordId,
  lesson: Lesson | undefined,
  cards: ReadonlyArray<HeldCard>,
  now: Instant,
  terms: MemoryTerms,
): Result<DueReview, DomainError> => {
  const taught = taughtWordOf(wordId, lesson)
  if (!taught.ok) {
    return taught
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
  return ok({ ...taught.value, held })
}

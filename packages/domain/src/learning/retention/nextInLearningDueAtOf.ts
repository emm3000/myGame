import type { DomainError } from '#DomainError'
import { dueInstantOf } from '#memory/dueInstantOf'
import type { MemoryTerms } from '#memory/MemoryTerms'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { HeldCard } from '../HeldCard'
import { isInLearning } from './isInLearning'

const earlierOf = (next: Instant | null, dueAt: Instant): Instant =>
  next === null || dueAt.epochMilliseconds < next.epochMilliseconds ? dueAt : next

export const nextInLearningDueAtOf = (
  cards: ReadonlyArray<HeldCard>,
  terms: MemoryTerms,
): Result<Instant | null, DomainError> => {
  let next: Instant | null = null
  for (const { card } of cards.filter(isInLearning)) {
    const dueAt = dueInstantOf(card, terms)
    if (!dueAt.ok) {
      return dueAt
    }
    next = earlierOf(next, dueAt.value)
  }
  return ok(next)
}

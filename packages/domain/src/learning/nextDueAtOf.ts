import type { DomainError } from '../DomainError'
import { dueInstantOf } from '../memory/dueInstantOf'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'

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

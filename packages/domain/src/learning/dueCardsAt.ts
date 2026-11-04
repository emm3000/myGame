import type { DomainError } from '../DomainError'
import { dueInstantOf } from '../memory/dueInstantOf'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { compareWordIds } from './compareWordIds'
import type { HeldCard } from './HeldCard'

export type DueCard = HeldCard & {
  readonly dueAt: Instant
}

const byDueThenWord = (left: DueCard, right: DueCard): number =>
  left.dueAt.epochMilliseconds - right.dueAt.epochMilliseconds ||
  compareWordIds(left.wordId, right.wordId)

export const dueCardsAt = (
  cards: ReadonlyArray<HeldCard>,
  now: Instant,
  terms: MemoryTerms,
): Result<ReadonlyArray<DueCard>, DomainError> => {
  const due: Array<DueCard> = []
  for (const held of cards) {
    const dueAt = dueInstantOf(held.card, terms)
    if (!dueAt.ok) {
      return dueAt
    }
    if (dueAt.value.epochMilliseconds <= now.epochMilliseconds) {
      due.push({ ...held, dueAt: dueAt.value })
    }
  }
  return ok(due.sort(byDueThenWord))
}

import type { Instant } from '../time/Instant'
import { forgettingCurveOf } from './forgettingCurveOf'
import type { MemoryCard } from './MemoryCard'
import type { MemoryTerms } from './MemoryTerms'
import { wholeDaysBetween } from './wholeDaysBetween'

export const retrievabilityOf = (card: MemoryCard, at: Instant, terms: MemoryTerms): number => {
  const stored = card.stored
  if (stored.lastReviewAt === null) {
    return 0
  }
  const { decay, factor } = forgettingCurveOf(terms.parameters)
  const elapsedDays = Math.max(0, wholeDaysBetween(stored.lastReviewAt, at))
  return (1 + (factor * elapsedDays) / stored.stability) ** decay
}

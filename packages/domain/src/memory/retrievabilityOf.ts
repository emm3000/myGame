import type { Instant } from '../time/Instant'
import type { MemoryCard } from './MemoryCard'
import type { MemoryTerms } from './MemoryTerms'
import { wholeDaysBetween } from './wholeDaysBetween'

const RETRIEVABILITY_AT_STABILITY = 0.9

export const retrievabilityOf = (card: MemoryCard, at: Instant, terms: MemoryTerms): number => {
  const stored = card.stored
  if (stored.lastReviewAt === null) {
    return 0
  }
  const decay = -terms.parameters[20]
  const factor = RETRIEVABILITY_AT_STABILITY ** (1 / decay) - 1
  const elapsedDays = Math.max(0, wholeDaysBetween(stored.lastReviewAt, at))
  return (1 + (factor * elapsedDays) / stored.stability) ** decay
}

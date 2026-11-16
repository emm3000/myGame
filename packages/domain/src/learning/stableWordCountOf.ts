import { cardsInLearningOf } from './cardsInLearningOf'
import type { HeldCard } from './HeldCard'

export const stableWordCountOf = (cards: ReadonlyArray<HeldCard>): number =>
  cards.length - cardsInLearningOf(cards)

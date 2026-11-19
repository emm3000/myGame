import type { HeldCard } from './HeldCard'
import { isInLearning } from './isInLearning'

export const cardsInLearningOf = (cards: ReadonlyArray<HeldCard>): number =>
  cards.filter(isInLearning).length

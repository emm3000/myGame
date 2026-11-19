import type { HeldCard } from './HeldCard'

const LEARNING_STABILITY_DAYS = 4

const isInLearning = ({ card }: HeldCard): boolean =>
  card.stored.stability === null || card.stored.stability < LEARNING_STABILITY_DAYS

export const cardsInLearningOf = (cards: ReadonlyArray<HeldCard>): number =>
  cards.filter(isInLearning).length

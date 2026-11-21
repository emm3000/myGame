import type { HeldCard } from '../HeldCard'

const LEARNING_STABILITY_DAYS = 4

export const isInLearning = ({ card }: HeldCard): boolean =>
  card.stored.stability === null || card.stored.stability < LEARNING_STABILITY_DAYS

import type { HeldCard } from './HeldCard'
import { SKILL_STABILITY_DAYS } from './skillStabilityDays'

const isInLearning = ({ card }: HeldCard): boolean =>
  card.stored.stability === null || card.stored.stability < SKILL_STABILITY_DAYS

export const cardsInLearningOf = (cards: ReadonlyArray<HeldCard>): number =>
  cards.filter(isInLearning).length

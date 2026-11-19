import type { HeldCard } from './HeldCard'
import { SKILL_STABILITY_DAYS } from './skillStabilityDays'

const isStable = ({ card }: HeldCard): boolean =>
  card.stored.stability !== null && card.stored.stability >= SKILL_STABILITY_DAYS

export const stableWordCountOf = (cards: ReadonlyArray<HeldCard>): number =>
  cards.filter(isStable).length

import type { HeldCard } from './HeldCard'
import { SKILL_STABILITY_DAYS } from './skillStabilityDays'

export const isWordRetained = (held: HeldCard): boolean => {
  const { retainedAt, stability } = held.card.stored
  return retainedAt !== null && stability !== null && stability >= SKILL_STABILITY_DAYS
}

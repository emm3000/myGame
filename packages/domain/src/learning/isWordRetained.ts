import type { HeldCard } from './HeldCard'

const SKILL_STABILITY_DAYS = 7

export const isWordRetained = (held: HeldCard): boolean => {
  const { retainedAt, stability } = held.card.stored
  return retainedAt !== null && stability !== null && stability >= SKILL_STABILITY_DAYS
}

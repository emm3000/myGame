import type { HeldCard } from './HeldCard'
import { isWordRetained } from './isWordRetained'
import { SKILL_STABILITY_DAYS } from './skillStabilityDays'

export type WordStanding = 'notStarted' | 'recognize' | 'recall' | 'hold' | 'retained'

export const wordStandingOf = (held: HeldCard | undefined): WordStanding => {
  if (held === undefined) {
    return 'notStarted'
  }
  if (isWordRetained(held)) {
    return 'retained'
  }
  const { state, stability } = held.card.stored
  if (state === 'learning') {
    return 'recognize'
  }
  return stability === null || stability < SKILL_STABILITY_DAYS ? 'recall' : 'hold'
}

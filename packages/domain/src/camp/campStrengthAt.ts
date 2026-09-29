import type { CampTierTerms } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { CampBattle } from './CampBattle'

const MILLISECONDS_PER_HOUR = 3_600_000

export const campStrengthAt = (
  tier: CampTierTerms,
  lastBattle: Pick<CampBattle, 'strength' | 'foughtAt'> | undefined,
  at: Instant,
): number => {
  if (lastBattle === undefined) {
    return tier.maxStrength
  }
  const elapsedMilliseconds = Math.max(
    0,
    at.epochMilliseconds - lastBattle.foughtAt.epochMilliseconds,
  )
  const regrown = Math.floor(
    (tier.maxStrength * elapsedMilliseconds) / (tier.regrowHours * MILLISECONDS_PER_HOUR),
  )
  return Math.min(tier.maxStrength, lastBattle.strength + regrown)
}

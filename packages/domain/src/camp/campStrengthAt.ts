import type { CampTierTerms } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { CampBattle } from './CampBattle'

const MILLISECONDS_PER_HOUR = 3_600_000

export const campStrengthAt = (
  tier: CampTierTerms,
  lastBattle: CampBattle | undefined,
  at: Instant,
): number => {
  if (lastBattle === undefined) {
    return tier.maxStrength
  }
  const elapsedMilliseconds = at.epochMilliseconds - lastBattle.foughtAt.epochMilliseconds
  const regrown = Math.floor(
    (tier.maxStrength * elapsedMilliseconds) / (tier.regrowHours * MILLISECONDS_PER_HOUR),
  )
  return Math.min(tier.maxStrength, lastBattle.strength + regrown)
}

import type { Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'
import type { ForageTerms } from '../ports/BuildingCatalog'

const SECONDS_PER_HOUR = 3_600

export const forageLootOfSeconds = (
  terrain: Terrain,
  infantry: number,
  foragedSeconds: number,
  forage: ForageTerms,
): Stocks => {
  const yieldPerHour = { ...forage.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(yieldPerHour).filter((ratePerHour) => ratePerHour > 0).length
  const lootOf = (ratePerHour: number): number =>
    ratePerHour > 0
      ? Math.min(
          Math.floor((infantry * ratePerHour * foragedSeconds) / SECONDS_PER_HOUR),
          Math.floor((forage.carryPerInfantry * infantry) / yielded),
        )
      : 0
  return {
    wood: lootOf(yieldPerHour.wood),
    stone: lootOf(yieldPerHour.stone),
    iron: lootOf(yieldPerHour.iron),
    gold: lootOf(yieldPerHour.gold),
    food: lootOf(yieldPerHour.food),
  }
}

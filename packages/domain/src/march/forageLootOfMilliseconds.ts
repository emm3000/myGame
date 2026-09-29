import type { Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'
import type { ForageTerms } from '../ports/BuildingCatalog'

const MILLISECONDS_PER_HOUR = 3_600_000

export const forageLootOfMilliseconds = (
  terrain: Terrain,
  infantry: number,
  foragedMilliseconds: number,
  forage: ForageTerms,
): Stocks => {
  const yieldPerHour = { ...forage.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(yieldPerHour).filter((ratePerHour) => ratePerHour > 0).length
  const lootOf = (ratePerHour: number): number =>
    ratePerHour > 0
      ? Math.min(
          Math.floor((infantry * ratePerHour * foragedMilliseconds) / MILLISECONDS_PER_HOUR),
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

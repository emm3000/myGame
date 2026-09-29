import type { Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'
import type { ForageTerms } from '../ports/BuildingCatalog'

export const forageLootOf = (
  terrain: Terrain,
  infantry: number,
  stayHours: number,
  forage: ForageTerms,
): Stocks => {
  const yieldPerHour = forage.yieldPerHour[terrain]
  const yielded = Object.values(yieldPerHour).filter((ratePerHour) => ratePerHour > 0).length
  const lootOf = (ratePerHour: number): number =>
    ratePerHour > 0
      ? Math.min(
          infantry * ratePerHour * stayHours,
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

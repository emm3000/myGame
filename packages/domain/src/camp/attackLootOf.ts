import type { AttackTerms, Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'

export const attackLootOf = (
  terrain: Terrain,
  campStrength: number,
  survivors: number,
  { forage, camps, units }: AttackTerms,
): Stocks => {
  const yieldPerHour = { ...forage.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(yieldPerHour).filter((ratePerHour) => ratePerHour > 0).length
  const share = Math.floor(
    Math.min(camps.lootPerStrength * campStrength, units.infantry.carry * survivors) /
      (yielded + 1),
  )
  const lootOf = (ratePerHour: number): number => (ratePerHour > 0 ? share : 0)
  return {
    wood: lootOf(yieldPerHour.wood),
    stone: lootOf(yieldPerHour.stone),
    iron: lootOf(yieldPerHour.iron),
    gold: share,
    food: lootOf(yieldPerHour.food),
  }
}

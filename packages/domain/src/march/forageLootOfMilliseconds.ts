import type { MarchTerms, Stocks } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { Terrain } from '../fief/Terrain'
import { unitKinds } from '../fief/unitKinds'
import { carryOf } from './carryOf'
import type { LootPercent } from './March'

const MILLISECONDS_PER_HOUR_IN_PERCENT = 360_000_000

export const forageLootOfMilliseconds = (
  terrain: Terrain,
  units: UnitCountsByKind,
  foragedMilliseconds: number,
  { forage, units: unitTerms }: MarchTerms,
  lootPercent: LootPercent,
): Stocks => {
  const yieldPerHour = { ...forage.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(yieldPerHour).filter((ratePerHour) => ratePerHour > 0).length
  const heads = unitKinds.reduce((total, unit) => total + units[unit], 0)
  const carryShare = Math.floor(carryOf(units, unitTerms) / yielded)
  const lootOf = (ratePerHour: number, percent: number): number =>
    ratePerHour > 0
      ? Math.min(
          Math.floor(
            (heads * ratePerHour * foragedMilliseconds * percent) /
              MILLISECONDS_PER_HOUR_IN_PERCENT,
          ),
          carryShare,
        )
      : 0
  return {
    wood: lootOf(yieldPerHour.wood, lootPercent.wood),
    stone: lootOf(yieldPerHour.stone, lootPercent.stone),
    iron: lootOf(yieldPerHour.iron, lootPercent.iron),
    gold: lootOf(yieldPerHour.gold, lootPercent.gold),
    food: lootOf(yieldPerHour.food, lootPercent.food),
  }
}

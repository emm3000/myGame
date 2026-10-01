import type { MarchTerms, Stocks } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { Terrain } from '../fief/Terrain'
import { unitKinds } from '../fief/unitKinds'
import { carryOf } from './carryOf'

const MILLISECONDS_PER_HOUR = 3_600_000

export const forageLootOfMilliseconds = (
  terrain: Terrain,
  units: UnitCountsByKind,
  foragedMilliseconds: number,
  { forage, units: unitTerms }: MarchTerms,
): Stocks => {
  const yieldPerHour = { ...forage.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(yieldPerHour).filter((ratePerHour) => ratePerHour > 0).length
  const heads = unitKinds.reduce((total, unit) => total + units[unit], 0)
  const carryShare = Math.floor(carryOf(units, unitTerms) / yielded)
  const lootOf = (ratePerHour: number): number =>
    ratePerHour > 0
      ? Math.min(
          Math.floor((heads * ratePerHour * foragedMilliseconds) / MILLISECONDS_PER_HOUR),
          carryShare,
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

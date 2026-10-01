import type { FiefOverview } from '@mygame/contracts'
import { byUnitKind } from './byUnitKind'

export type UnitCounts = FiefOverview['units']

export function unitsAtHomeOf(fief: FiefOverview): UnitCounts {
  return byUnitKind((unit) => fief.units[unit] - (fief.march?.units[unit] ?? 0))
}

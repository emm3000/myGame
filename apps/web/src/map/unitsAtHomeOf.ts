import type { FiefOverview } from '@mygame/contracts'
import type { UnitCounts } from '../units/UnitCounts'
import { byUnitKind } from './byUnitKind'

export function unitsAtHomeOf(fief: FiefOverview): UnitCounts {
  return byUnitKind((unit) => fief.units[unit] - (fief.march?.units[unit] ?? 0))
}

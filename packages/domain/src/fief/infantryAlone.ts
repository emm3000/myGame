import { byUnitKind } from './byUnitKind'
import type { UnitCountsByKind } from './FiefUnitCounts'

export const infantryAlone = (infantry: number): UnitCountsByKind =>
  byUnitKind((unit) => (unit === 'infantry' ? infantry : 0))

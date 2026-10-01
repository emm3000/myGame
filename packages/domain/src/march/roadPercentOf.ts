import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { unitKinds } from '../fief/unitKinds'
import type { FiefSettings } from '../ports/BuildingCatalog'

export const roadPercentOf = (units: UnitCountsByKind, terms: FiefSettings['units']): number =>
  unitKinds
    .filter((unit) => units[unit] >= 1)
    .reduce((slowest, unit) => Math.max(slowest, terms[unit].roadPercent), 0)

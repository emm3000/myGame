import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { unitKinds } from '../fief/unitKinds'
import type { FiefSettings } from '../ports/BuildingCatalog'

export const carryOf = (units: UnitCountsByKind, terms: FiefSettings['units']): number =>
  unitKinds.reduce((carry, unit) => carry + units[unit] * terms[unit].carry, 0)

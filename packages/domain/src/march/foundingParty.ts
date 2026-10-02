import { byUnitKind } from '../fief/byUnitKind'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'

export const foundingParty: UnitCountsByKind = byUnitKind((unit) => (unit === 'settler' ? 1 : 0))

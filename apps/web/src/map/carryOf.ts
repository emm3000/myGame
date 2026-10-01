import type { FiefOverview } from '@mygame/contracts'
import { UnitKindSchema } from '@mygame/contracts'
import type { UnitCounts } from './unitsAtHomeOf'

export function carryOf(party: UnitCounts, fief: FiefOverview): number {
  return UnitKindSchema.options.reduce(
    (carry, unit) => carry + party[unit] * fief.unitTerms[unit].carry,
    0,
  )
}

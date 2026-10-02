import type { FiefOverview } from '@mygame/contracts'
import { partyKinds } from '../units/partyKinds'
import type { UnitCounts } from '../units/UnitCounts'

export function carryOf(party: UnitCounts, fief: FiefOverview): number {
  return partyKinds.reduce((carry, unit) => carry + party[unit] * fief.unitTerms[unit].carry, 0)
}

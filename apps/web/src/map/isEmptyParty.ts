import { partyKinds } from '../units/partyKinds'
import type { UnitCounts } from '../units/UnitCounts'

export function isEmptyParty(party: UnitCounts): boolean {
  return partyKinds.every((unit) => party[unit] === 0)
}

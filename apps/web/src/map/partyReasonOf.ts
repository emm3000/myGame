import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import { partyKinds } from '../units/partyKinds'
import type { UnitCounts } from '../units/UnitCounts'
import { isEmptyParty } from './isEmptyParty'
import { unitsAtHomeOf } from './unitsAtHomeOf'

export function partyReasonOf(party: UnitCounts, fief: FiefOverview): string | undefined {
  if (isEmptyParty(party)) {
    return copy.march.emptyParty
  }
  const atHome = unitsAtHomeOf(fief)
  const short = partyKinds.find((unit) => party[unit] > atHome[unit])
  return short === undefined
    ? undefined
    : copy.march.notEnoughAtHome(short, party[short], atHome[short])
}

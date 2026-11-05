import { marchEmptyParty, marchNotEnoughAtHome } from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import { countedUnitsOf } from '../units/countedUnitsOf'
import { partyKinds } from '../units/partyKinds'
import type { UnitCounts } from '../units/UnitCounts'
import { isEmptyParty } from './isEmptyParty'
import { unitsAtHomeOf } from './unitsAtHomeOf'

export function partyReasonOf(party: UnitCounts, fief: FiefOverview): string | undefined {
  if (isEmptyParty(party)) {
    return marchEmptyParty()
  }
  const atHome = unitsAtHomeOf(fief)
  const short = partyKinds.find((unit) => party[unit] > atHome[unit])
  return short === undefined
    ? undefined
    : marchNotEnoughAtHome({ units: countedUnitsOf(short, party[short]), atHome: atHome[short] })
}

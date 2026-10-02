import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import type { MarchFormAtHome } from '../design-system/MarchForm'
import { partyKinds } from '../units/partyKinds'
import { unitsAtHomeOf } from './unitsAtHomeOf'

export function atHomeTalliesOf(fief: FiefOverview): ReadonlyArray<MarchFormAtHome> {
  const atHome = unitsAtHomeOf(fief)
  return partyKinds.map((unit) => ({
    unit,
    tally: { count: atHome[unit], label: copy.army.atHome(unit, atHome[unit]) },
  }))
}

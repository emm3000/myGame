import { armyAtHome } from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import type { MarchFormAtHome } from '../design-system/MarchForm'
import { partyKinds } from '../units/partyKinds'
import { unitLabelsOf } from '../units/unitLabelsOf'
import { unitsAtHomeOf } from './unitsAtHomeOf'

export function atHomeTalliesOf(fief: FiefOverview): ReadonlyArray<MarchFormAtHome> {
  const atHome = unitsAtHomeOf(fief)
  return partyKinds.map((unit) => ({
    unit,
    tally: {
      count: atHome[unit],
      label: armyAtHome({ count: atHome[unit], ...unitLabelsOf(unit) }),
    },
  }))
}

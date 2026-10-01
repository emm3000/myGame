import type { FiefOverview } from '@mygame/contracts'
import { UnitKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import type { MarchFormAtHome } from '../design-system/MarchForm'
import { unitsAtHomeOf } from './unitsAtHomeOf'

export function atHomeTalliesOf(fief: FiefOverview): ReadonlyArray<MarchFormAtHome> {
  const atHome = unitsAtHomeOf(fief)
  return UnitKindSchema.options.map((unit) => ({
    unit,
    tally: { count: atHome[unit], label: copy.army.atHome(unit, atHome[unit]) },
  }))
}

import {
  armyAtHome,
  foundingArrivalHeading,
  foundingFound,
  foundingTitle,
  marchMarchAway,
  marchNotEnoughAtHome,
  marchRoadHeading,
  refusalBlankFiefName,
} from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import type { MarchActionState } from '../design-system/CardAction'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { countedUnitsOf } from '../units/countedUnitsOf'
import type { UnitCounts } from '../units/UnitCounts'
import { unitLabelsOf } from '../units/unitLabelsOf'
import type { MarchFormContent, MarchTarget } from './marchFormOf'
import { oneWaySecondsOf } from './oneWaySecondsOf'
import { roadMarksOf } from './roadMarksOf'
import { unitsAtHomeOf } from './unitsAtHomeOf'

const oneSettler: UnitCounts = { infantry: 0, cavalry: 0, archer: 0, settler: 1 }

function previewOf(target: MarchTarget, fief: FiefOverview): ReadonlyArray<PreviewLine> {
  const oneWay = formatDuration(oneWaySecondsOf(target, oneSettler, fief))
  return [
    { heading: marchRoadHeading(), value: oneWay, isNumeral: true, marks: roadMarksOf(fief) },
    { heading: foundingArrivalHeading(), value: oneWay, isNumeral: true },
  ]
}

function stateOf(name: string, settlersAtHome: number, fief: FiefOverview): MarchActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: marchMarchAway() }
  }
  if (name.trim() === '') {
    return { kind: 'blocked', reason: refusalBlankFiefName() }
  }
  return settlersAtHome < oneSettler.settler
    ? {
        kind: 'blocked',
        reason: marchNotEnoughAtHome({
          units: countedUnitsOf('settler', oneSettler.settler),
          atHome: settlersAtHome,
        }),
      }
    : { kind: 'affordable' }
}

export function foundingFormOf(
  target: MarchTarget,
  name: string,
  fief: FiefOverview,
): MarchFormContent {
  const settlersAtHome = unitsAtHomeOf(fief).settler
  return {
    title: foundingTitle({ province: target.province, plot: target.plot }),
    atHome: [
      {
        unit: 'settler',
        tally: {
          count: settlersAtHome,
          label: armyAtHome({ count: settlersAtHome, ...unitLabelsOf('settler') }),
        },
      },
    ],
    isFieldDisabled: fief.march !== null,
    preview: name.trim() === '' ? undefined : previewOf(target, fief),
    actionLabel: foundingFound(),
    state: stateOf(name, settlersAtHome, fief),
  }
}

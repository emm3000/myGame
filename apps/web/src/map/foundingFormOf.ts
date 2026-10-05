import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import type { SubmitActionState } from '../design-system/SubmitAction'
import type { UnitCounts } from '../units/UnitCounts'
import type { MarchFormContent, MarchTarget } from './marchFormOf'
import { oneWaySecondsOf } from './oneWaySecondsOf'
import { roadMarksOf } from './roadMarksOf'
import { unitsAtHomeOf } from './unitsAtHomeOf'

const oneSettler: UnitCounts = { infantry: 0, cavalry: 0, archer: 0, settler: 1 }

function previewOf(target: MarchTarget, fief: FiefOverview): ReadonlyArray<PreviewLine> {
  const oneWay = formatDuration(oneWaySecondsOf(target, oneSettler, fief))
  return [
    { heading: copy.march.roadHeading, value: oneWay, isNumeral: true, marks: roadMarksOf(fief) },
    { heading: copy.founding.arrivalHeading, value: oneWay, isNumeral: true },
  ]
}

function stateOf(name: string, settlersAtHome: number, fief: FiefOverview): SubmitActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: copy.march.marchAway }
  }
  if (name.trim() === '') {
    return { kind: 'blocked', reason: copy.founding.blankName }
  }
  return settlersAtHome < oneSettler.settler
    ? {
        kind: 'blocked',
        reason: copy.march.notEnoughAtHome('settler', oneSettler.settler, settlersAtHome),
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
    title: copy.founding.title(target.province, target.plot),
    atHome: [
      {
        unit: 'settler',
        tally: { count: settlersAtHome, label: copy.army.atHome('settler', settlersAtHome) },
      },
    ],
    isFieldDisabled: fief.march !== null,
    preview: name.trim() === '' ? undefined : previewOf(target, fief),
    actionLabel: copy.founding.found,
    state: stateOf(name, settlersAtHome, fief),
  }
}

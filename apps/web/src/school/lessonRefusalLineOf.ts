import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { LiveTown } from '../town/liveTown'
import type { RefusedTownAction } from '../town/useTownAction'
import { capWaitLabelOf } from './capWaitLabelOf'

export function lessonRefusalLineOf(
  { refusal, error }: RefusedTownAction<string>,
  town: LiveTown,
  fixedCopy: PlayerCopy['fixedCopy'],
): Label {
  return fixedCopy((catalog, pieces) => {
    const timeLeft = capWaitLabelOf(pieces, town)
    if (error?.kind !== 'LearningCapReached' || timeLeft === null) {
      return refusalLineOf(catalog, refusal, error)
    }
    return catalog.refusalLearningCapNextWordDue({ ...error.params, timeLeft })
  })
}

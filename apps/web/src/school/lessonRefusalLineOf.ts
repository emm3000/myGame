import { es } from '@mygame/catalog'
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
  const timeLeft = capWaitLabelOf(es, town)
  if (error?.kind !== 'LearningCapReached' || timeLeft === null) {
    return fixedCopy((catalog) => refusalLineOf(catalog, refusal, error))
  }
  return fixedCopy((catalog) =>
    catalog.refusalLearningCapNextWordDue({ ...error.params, timeLeft }),
  )
}

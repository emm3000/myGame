import { refusalLearningCapNextWordDue } from '@mygame/catalog'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { LiveTown } from '../town/liveTown'
import type { RefusedTownAction } from '../town/useTownAction'
import { capWaitLabelOf } from './capWaitLabelOf'

export function lessonRefusalLineOf(
  { refusal, error }: RefusedTownAction<string>,
  town: LiveTown,
): string {
  const timeLeft = capWaitLabelOf(town)
  if (error?.kind !== 'LearningCapReached' || timeLeft === null) {
    return refusalLineOf(refusal, error)
  }
  return refusalLearningCapNextWordDue({ ...error.params, timeLeft })
}

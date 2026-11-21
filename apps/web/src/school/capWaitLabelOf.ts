import { es } from '@mygame/catalog'
import { formatFinish } from '../time/formatFinish'
import type { LiveTown } from '../town/liveTown'

export function capWaitLabelOf({ overview, at }: LiveTown): string | null {
  const dueAt = overview.learning.nextInLearningDueAt
  if (dueAt === null || overview.nextStep.kind === 'reviews') {
    return null
  }
  const remainingSeconds = (Date.parse(dueAt) - at.getTime()) / 1000
  return remainingSeconds > 0 ? formatFinish(es, remainingSeconds, at) : null
}

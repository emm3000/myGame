import type { DomainError } from '../DomainError'
import type { ChangedFief } from '../fief/ChangedFief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { LessonId } from '../learning/Lesson'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { Result } from '../Result'

export type CancelLessonCommand = FiefOfPlayer & {
  readonly lessonId: LessonId
}

export type CancelLessonDependencies = {
  readonly fiefs: Pick<FiefRepository, 'fiefOf' | 'save'>
  readonly chronicle: ChronicleWriter
  readonly clock: Clock
}

export const cancelLesson = async (
  command: CancelLessonCommand,
  { fiefs, chronicle, clock }: CancelLessonDependencies,
): Promise<Result<ChangedFief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.fiefId)
  if (!stored.ok) {
    return stored
  }
  const owned = ownFiefOf(stored.value, command)
  if (!owned.ok) {
    return owned
  }
  const cancelled = owned.value.cancelLesson(command.lessonId, clock.now())
  if (!cancelled.ok) {
    return cancelled
  }
  const saved = await fiefs.save(cancelled.value.fief)
  if (!saved.ok) {
    return saved
  }
  const recorded = await chronicle.record(cancelled.value.fief.id, cancelled.value.events)
  if (!recorded.ok) {
    return recorded
  }
  return cancelled
}

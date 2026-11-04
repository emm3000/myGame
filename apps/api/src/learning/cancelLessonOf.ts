import {
  cancelLesson,
  type DomainError,
  type FiefOfPlayer,
  type LessonId,
  type Result,
} from '@mygame/domain'
import type { FiefReading } from '../fief/FiefReading'
import { fiefReadingAt } from '../fief/fiefReadingAt'
import { mutateAfterResolve } from '../fief/mutateAfterResolve'
import type { LearningDependencies } from './LearningDependencies'

export const cancelLessonOf = async (
  fiefOfPlayer: FiefOfPlayer,
  lessonId: LessonId,
  dependencies: LearningDependencies,
): Promise<Result<FiefReading, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    async ({ fiefs, chronicle }, clock) => {
      const cancelled = await cancelLesson(
        { ...fiefOfPlayer, lessonId },
        { fiefs, chronicle, clock },
      )
      return cancelled.ok
        ? fiefReadingAt(cancelled.value.fief, dependencies.buildingCatalog, clock.now())
        : cancelled
    },
    dependencies,
  )

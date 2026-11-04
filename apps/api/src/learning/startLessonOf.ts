import {
  type DomainError,
  type FiefOfPlayer,
  type LessonId,
  type Result,
  startLesson,
} from '@mygame/domain'
import type { FiefReading } from '../fief/FiefReading'
import { fiefReadingAt } from '../fief/fiefReadingAt'
import { mutateEveryFiefAfterResolve } from '../fief/mutateEveryFiefAfterResolve'
import type { LearningDependencies } from './LearningDependencies'

export const startLessonOf = async (
  fiefOfPlayer: FiefOfPlayer,
  lessonId: LessonId,
  dependencies: LearningDependencies,
): Promise<Result<FiefReading, DomainError>> =>
  mutateEveryFiefAfterResolve(
    fiefOfPlayer,
    async ({ fiefs, cards }, clock) => {
      const started = await startLesson(
        { ...fiefOfPlayer, lessonId },
        {
          fiefs,
          cards,
          lessons: dependencies.lessons,
          catalog: dependencies.buildingCatalog,
          clock,
        },
      )
      return started.ok
        ? fiefReadingAt(started.value, dependencies.buildingCatalog, clock.now())
        : started
    },
    dependencies,
  )

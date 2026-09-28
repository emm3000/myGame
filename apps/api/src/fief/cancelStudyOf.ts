import {
  cancelStudy,
  type DomainError,
  type Fief,
  ok,
  type PlayerId,
  type Result,
  type StudyTarget,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type CancelStudyDependencies = MutateAfterResolveDependencies

export const cancelStudyOf = async (
  playerId: PlayerId,
  target: StudyTarget,
  dependencies: CancelStudyDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    async (fiefs, clock) => {
      const cancelled = await cancelStudy(
        { playerId, ...target },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      )
      return cancelled.ok ? ok(cancelled.value.fief) : cancelled
    },
    dependencies,
  )

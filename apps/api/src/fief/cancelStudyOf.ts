import {
  cancelStudy,
  type DomainError,
  type Fief,
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
    (fiefs, clock) =>
      cancelStudy({ playerId, ...target }, { fiefs, catalog: dependencies.buildingCatalog, clock }),
    dependencies,
  )

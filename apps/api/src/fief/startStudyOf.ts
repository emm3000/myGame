import {
  type ArtKind,
  type DomainError,
  type Fief,
  type PlayerId,
  type Result,
  startStudy,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type StartStudyDependencies = MutateAfterResolveDependencies

export const startStudyOf = async (
  playerId: PlayerId,
  art: ArtKind,
  dependencies: StartStudyDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    (fiefs, clock) =>
      startStudy({ playerId, art }, { fiefs, catalog: dependencies.buildingCatalog, clock }),
    dependencies,
  )

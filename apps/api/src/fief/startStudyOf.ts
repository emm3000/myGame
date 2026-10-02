import {
  type ArtKind,
  type DomainError,
  type Fief,
  type FiefOfPlayer,
  type Result,
  startStudy,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type StartStudyDependencies = MutateAfterResolveDependencies

export const startStudyOf = async (
  fiefOfPlayer: FiefOfPlayer,
  art: ArtKind,
  dependencies: StartStudyDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    ({ fiefs }, clock) =>
      startStudy({ ...fiefOfPlayer, art }, { fiefs, catalog: dependencies.buildingCatalog, clock }),
    dependencies,
  )

import type { RecallMarchRequest } from '@mygame/contracts'
import {
  type DomainError,
  type Fief,
  type FiefOfPlayer,
  Instant,
  type Result,
  recallMarch,
} from '@mygame/domain'
import type { MutateAfterResolveDependencies } from './mutateAfterResolve'
import { mutateFiefPairAfterResolve } from './mutateFiefPairAfterResolve'

export type RecallMarchDependencies = MutateAfterResolveDependencies

export const recallMarchOf = async (
  fiefOfPlayer: FiefOfPlayer,
  { departedAt }: RecallMarchRequest,
  dependencies: RecallMarchDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateFiefPairAfterResolve(
    fiefOfPlayer,
    ({ fiefs }, clock) =>
      recallMarch(
        { ...fiefOfPlayer, departedAt: Instant.fromEpochMilliseconds(Date.parse(departedAt)) },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

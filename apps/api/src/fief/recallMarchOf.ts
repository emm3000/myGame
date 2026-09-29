import type { RecallMarchRequest } from '@mygame/contracts'
import {
  type DomainError,
  type Fief,
  Instant,
  type PlayerId,
  type Result,
  recallMarch,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type RecallMarchDependencies = MutateAfterResolveDependencies

export const recallMarchOf = async (
  playerId: PlayerId,
  { departedAt }: RecallMarchRequest,
  dependencies: RecallMarchDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    ({ fiefs }, clock) =>
      recallMarch(
        { playerId, departedAt: Instant.fromEpochMilliseconds(Date.parse(departedAt)) },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

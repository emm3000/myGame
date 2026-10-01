import type { DispatchMarchRequest } from '@mygame/contracts'
import {
  type DomainError,
  dispatchMarch,
  type Fief,
  type KingdomMapReader,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type DispatchMarchDependencies = MutateAfterResolveDependencies & {
  readonly map: KingdomMapReader
}

export const dispatchMarchOf = async (
  playerId: PlayerId,
  request: DispatchMarchRequest,
  dependencies: DispatchMarchDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    ({ fiefs }, clock) =>
      dispatchMarch(
        {
          playerId,
          province: request.province,
          plot: request.plot,
          units: request.units,
          stayHours: request.stayHours,
        },
        { fiefs, map: dependencies.map, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

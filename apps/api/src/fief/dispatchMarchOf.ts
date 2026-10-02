import type { DispatchMarchRequest } from '@mygame/contracts'
import {
  type DomainError,
  dispatchMarch,
  type Fief,
  type FiefOfPlayer,
  type KingdomMapReader,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type DispatchMarchDependencies = MutateAfterResolveDependencies & {
  readonly map: KingdomMapReader
}

export const dispatchMarchOf = async (
  fiefOfPlayer: FiefOfPlayer,
  request: DispatchMarchRequest,
  dependencies: DispatchMarchDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    ({ fiefs }, clock) =>
      dispatchMarch(
        {
          ...fiefOfPlayer,
          province: request.province,
          plot: request.plot,
          units: request.units,
          stayHours: request.stayHours,
        },
        { fiefs, map: dependencies.map, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

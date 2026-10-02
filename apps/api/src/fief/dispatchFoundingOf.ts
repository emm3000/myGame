import type { DispatchFoundingRequest } from '@mygame/contracts'
import {
  type DomainError,
  dispatchFounding,
  type Fief,
  type FiefOfPlayer,
  type KingdomMapReader,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type DispatchFoundingDependencies = MutateAfterResolveDependencies & {
  readonly map: KingdomMapReader
}

export const dispatchFoundingOf = async (
  fiefOfPlayer: FiefOfPlayer,
  request: DispatchFoundingRequest,
  dependencies: DispatchFoundingDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    ({ fiefs }, clock) =>
      dispatchFounding(
        {
          ...fiefOfPlayer,
          province: request.province,
          plot: request.plot,
          name: request.name,
        },
        { fiefs, map: dependencies.map, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

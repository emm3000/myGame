import type { DispatchAttackRequest } from '@mygame/contracts'
import {
  type DomainError,
  dispatchAttack,
  type Fief,
  type FiefOfPlayer,
  type KingdomMapReader,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type DispatchAttackDependencies = MutateAfterResolveDependencies & {
  readonly map: KingdomMapReader
}

export const dispatchAttackOf = async (
  fiefOfPlayer: FiefOfPlayer,
  request: DispatchAttackRequest,
  dependencies: DispatchAttackDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    ({ fiefs, camps }, clock) =>
      dispatchAttack(
        {
          ...fiefOfPlayer,
          province: request.province,
          plot: request.plot,
          units: request.units,
        },
        { fiefs, map: dependencies.map, camps, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

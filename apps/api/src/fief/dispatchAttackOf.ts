import type { DispatchAttackRequest } from '@mygame/contracts'
import {
  type DomainError,
  dispatchAttack,
  type Fief,
  type KingdomMapReader,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type DispatchAttackDependencies = MutateAfterResolveDependencies & {
  readonly map: KingdomMapReader
}

export const dispatchAttackOf = async (
  playerId: PlayerId,
  request: DispatchAttackRequest,
  dependencies: DispatchAttackDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    ({ fiefs, camps }, clock) =>
      dispatchAttack(
        {
          playerId,
          province: request.province,
          plot: request.plot,
          units: { infantry: request.infantry, cavalry: 0 },
        },
        { fiefs, map: dependencies.map, camps, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )

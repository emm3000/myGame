import type { DispatchTransportRequest } from '@mygame/contracts'
import {
  type DomainError,
  dispatchTransport,
  type Fief,
  type FiefOfPlayer,
  type Result,
} from '@mygame/domain'
import type { MutateAfterResolveDependencies } from './mutateAfterResolve'
import { mutateFiefPairAfterResolve } from './mutateFiefPairAfterResolve'

export type DispatchTransportDependencies = MutateAfterResolveDependencies

export const dispatchTransportOf = async (
  fiefOfPlayer: FiefOfPlayer,
  request: DispatchTransportRequest,
  dependencies: DispatchTransportDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateFiefPairAfterResolve(
    fiefOfPlayer,
    ({ fiefs, chronicle }, clock) =>
      dispatchTransport(
        {
          ...fiefOfPlayer,
          toFiefId: request.toFiefId,
          units: request.units,
          cargo: request.cargo,
        },
        { fiefs, catalog: dependencies.buildingCatalog, chronicle, clock },
      ),
    dependencies,
  )

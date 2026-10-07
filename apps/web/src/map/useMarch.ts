import type {
  DispatchAttackRequest,
  DispatchFoundingRequest,
  DispatchMarchRequest,
  DispatchTransportRequest,
  FiefOverview,
} from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'
import { type RefusedAction, useFiefAction } from '../fief/useFiefAction'

type MarchRequest =
  | DispatchMarchRequest
  | DispatchAttackRequest
  | DispatchFoundingRequest
  | DispatchTransportRequest

export interface March {
  readonly isWaiting: boolean
  readonly refused: RefusedAction<MarchRequest> | undefined
  readonly send: (request: DispatchMarchRequest) => void
  readonly attack: (request: DispatchAttackRequest) => void
  readonly found: (request: DispatchFoundingRequest) => void
  readonly transport: (request: DispatchTransportRequest) => void
  readonly dismissRefusal: () => void
}

export function useMarch(
  apiClient: ApiClient,
  fiefId: string,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): March {
  const { isWaiting, refused, run, dismissRefusal } = useFiefAction<MarchRequest>(adopt, readAt)

  return {
    isWaiting,
    refused,
    send: (request) => run(request, () => apiClient.dispatchMarch(fiefId, request)),
    attack: (request) => run(request, () => apiClient.dispatchAttack(fiefId, request)),
    found: (request) => run(request, () => apiClient.dispatchFounding(fiefId, request)),
    transport: (request) => run(request, () => apiClient.dispatchTransport(fiefId, request)),
    dismissRefusal,
  }
}

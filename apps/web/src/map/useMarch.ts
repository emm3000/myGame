import type { DispatchMarchRequest, FiefOverview } from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from '../fief/useFiefAction'

export interface March {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly send: (request: DispatchMarchRequest) => void
}

export function useMarch(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): March {
  const { isWaiting, refused, run } = useFiefAction<DispatchMarchRequest>(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    send: (request) => run(request, () => apiClient.dispatchMarch(request)),
  }
}

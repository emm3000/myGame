import type { CancelUpgradeRequest, FiefOverview } from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface Cancel {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly start: (target: CancelUpgradeRequest, onCancelled: () => void) => void
}

export function useCancel(
  apiClient: ApiClient,
  fiefId: string,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Cancel {
  const { isWaiting, refused, run } = useFiefAction<CancelUpgradeRequest>(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    start: (target, onCancelled) =>
      run(target, () => apiClient.cancelUpgrade(fiefId, target), onCancelled),
  }
}

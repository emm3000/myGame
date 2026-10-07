import type { FiefOverview, RecallMarchRequest } from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface Recall {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly start: (target: RecallMarchRequest, onRecalled: () => void) => void
}

export function useRecall(
  apiClient: ApiClient,
  fiefId: string,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Recall {
  const { isWaiting, refused, run } = useFiefAction<RecallMarchRequest>(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    start: (target, onRecalled) =>
      run(target, () => apiClient.recallMarch(fiefId, target), onRecalled),
  }
}

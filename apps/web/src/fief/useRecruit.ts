import type {
  CancelRecruitOrderRequest,
  FiefOverview,
  PlaceRecruitOrderRequest,
} from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'
import { type RefusedAction, useFiefAction } from './useFiefAction'

export interface Recruit {
  readonly isWaiting: boolean
  readonly refused: RefusedAction<PlaceRecruitOrderRequest | CancelRecruitOrderRequest> | undefined
  readonly place: (request: PlaceRecruitOrderRequest) => void
  readonly cancel: (target: CancelRecruitOrderRequest) => void
}

export function useRecruit(
  apiClient: ApiClient,
  fiefId: string,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Recruit {
  const { isWaiting, refused, run } = useFiefAction<
    PlaceRecruitOrderRequest | CancelRecruitOrderRequest
  >(adopt, readAt)

  return {
    isWaiting,
    refused,
    place: (request) => run(request, () => apiClient.placeRecruitOrder(fiefId, request)),
    cancel: (target) => run(target, () => apiClient.cancelRecruitOrder(fiefId, target)),
  }
}

import type {
  CancelRecruitOrderRequest,
  FiefOverview,
  PlaceRecruitOrderRequest,
} from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface Recruit {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly place: (request: PlaceRecruitOrderRequest) => void
  readonly cancel: (target: CancelRecruitOrderRequest) => void
}

export function useRecruit(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Recruit {
  const { isWaiting, refused, run } = useFiefAction<
    PlaceRecruitOrderRequest | CancelRecruitOrderRequest
  >(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    place: (request) => run(request, () => apiClient.placeRecruitOrder(request)),
    cancel: (target) => run(target, () => apiClient.cancelRecruitOrder(target)),
  }
}

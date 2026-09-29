import type { FiefOverview, PlaceRecruitOrderRequest } from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface Recruit {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly place: (request: PlaceRecruitOrderRequest) => void
}

export function useRecruit(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Recruit {
  const { isWaiting, refused, run } = useFiefAction<PlaceRecruitOrderRequest>(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    place: (request) => run(request, () => apiClient.placeRecruitOrder(request)),
  }
}

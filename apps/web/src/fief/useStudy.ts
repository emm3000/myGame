import type { ArtKind, CancelStudyRequest, FiefOverview } from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface Study {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly start: (art: ArtKind) => void
  readonly cancel: (target: CancelStudyRequest) => void
}

export function useStudy(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Study {
  const { isWaiting, refused, run } = useFiefAction<ArtKind | CancelStudyRequest>(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    start: (art) => run(art, () => apiClient.startStudy(art)),
    cancel: (target) => run(target, () => apiClient.cancelStudy(target)),
  }
}

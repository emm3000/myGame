import type { ArtKind, CancelStudyRequest, FiefOverview } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiOutcome, ApiRefusal } from '../api/apiClient'

export interface Study {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly start: (art: ArtKind) => void
  readonly cancel: (target: CancelStudyRequest) => void
}

interface RefusalOfRead {
  readonly refusal: ApiRefusal
  readonly readAt: string | undefined
}

export function useStudy(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Study {
  const [isWaiting, setIsWaiting] = useState(false)
  const [refused, setRefused] = useState<RefusalOfRead>()
  const isInFlight = useRef(false)

  const perform = useCallback(
    async (call: () => Promise<ApiOutcome<FiefOverview>>): Promise<void> => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setIsWaiting(true)
      setRefused(undefined)
      const outcome = await call()
      isInFlight.current = false
      setIsWaiting(false)
      if (outcome.ok) {
        adopt(outcome.value)
        return
      }
      setRefused({ refusal: outcome.refusal, readAt })
    },
    [adopt, readAt],
  )

  return {
    isWaiting,
    refusal: refused?.readAt === readAt ? refused?.refusal : undefined,
    start: (art) => void perform(() => apiClient.startStudy(art)),
    cancel: (target) => void perform(() => apiClient.cancelStudy(target)),
  }
}

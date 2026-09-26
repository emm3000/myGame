import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export interface Cancel {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly start: () => void
}

interface RefusalOfRead {
  readonly refusal: ApiRefusal
  readonly readAt: string | undefined
}

export function useCancel(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Cancel {
  const [isWaiting, setIsWaiting] = useState(false)
  const [refused, setRefused] = useState<RefusalOfRead>()
  const isInFlight = useRef(false)

  const start = useCallback(async (): Promise<void> => {
    if (isInFlight.current) {
      return
    }
    isInFlight.current = true
    setIsWaiting(true)
    setRefused(undefined)
    const outcome = await apiClient.cancelUpgrade()
    isInFlight.current = false
    setIsWaiting(false)
    if (outcome.ok) {
      adopt(outcome.value)
      return
    }
    setRefused({ refusal: outcome.refusal, readAt })
  }, [apiClient, adopt, readAt])

  return {
    isWaiting,
    refusal: refused?.readAt === readAt ? refused?.refusal : undefined,
    start: () => void start(),
  }
}

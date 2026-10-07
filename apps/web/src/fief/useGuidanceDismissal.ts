import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export interface GuidanceDismissal {
  readonly isDismissed: boolean
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly dismiss: (onDismissed: () => void) => void
}

export function useGuidanceDismissal(apiClient: ApiClient, fiefId: string): GuidanceDismissal {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [refusal, setRefusal] = useState<ApiRefusal | undefined>(undefined)
  const isInFlight = useRef(false)

  const dismiss = useCallback(
    (onDismissed: () => void): void => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setIsWaiting(true)
      setRefusal(undefined)
      void apiClient.dismissGuidance(fiefId).then((answer) => {
        isInFlight.current = false
        setIsWaiting(false)
        if (answer === undefined) {
          setIsDismissed(true)
          onDismissed()
          return
        }
        setRefusal(answer)
      })
    },
    [apiClient, fiefId],
  )

  return { isDismissed, isWaiting, refusal, dismiss }
}

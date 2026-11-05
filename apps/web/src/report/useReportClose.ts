import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export interface ReportClose {
  readonly isClosed: boolean
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly close: (onClosed: () => void) => void
}

export function useReportClose(apiClient: ApiClient): ReportClose {
  const [isClosed, setIsClosed] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [refusal, setRefusal] = useState<ApiRefusal | undefined>(undefined)
  const isInFlight = useRef(false)

  const close = useCallback(
    (onClosed: () => void): void => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setIsWaiting(true)
      setRefusal(undefined)
      void apiClient.closeReport().then((answer) => {
        isInFlight.current = false
        setIsWaiting(false)
        setRefusal(answer)
        if (answer === undefined) {
          setIsClosed(true)
          onClosed()
        }
      })
    },
    [apiClient],
  )

  return { isClosed, isWaiting, refusal, close }
}

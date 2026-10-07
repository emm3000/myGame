import type { Digest } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type DigestState =
  | { readonly kind: 'silent' }
  | { readonly kind: 'due'; readonly digest: Digest; readonly readAt: Date }

export interface DigestHandle {
  readonly state: DigestState
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly acknowledge: (onAcknowledged: () => void) => void
}

export function useDigest(apiClient: ApiClient): DigestHandle {
  const [state, setState] = useState<DigestState>({ kind: 'silent' })
  const [isWaiting, setIsWaiting] = useState(false)
  const [refusal, setRefusal] = useState<ApiRefusal | undefined>(undefined)
  const isInFlight = useRef(false)

  useEffect(() => {
    let isCurrent = true
    void apiClient.digest().then((outcome) => {
      if (isCurrent && outcome.ok && outcome.value.isDue) {
        setState({ kind: 'due', digest: outcome.value, readAt: new Date() })
      }
    })
    return () => {
      isCurrent = false
    }
  }, [apiClient])

  const acknowledge = useCallback(
    (onAcknowledged: () => void): void => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setIsWaiting(true)
      setRefusal(undefined)
      void apiClient.acknowledgeDigest().then((answer) => {
        isInFlight.current = false
        setIsWaiting(false)
        if (answer === undefined) {
          setState({ kind: 'silent' })
          onAcknowledged()
          return
        }
        setRefusal(answer)
      })
    },
    [apiClient],
  )

  return { state, isWaiting, refusal, acknowledge }
}

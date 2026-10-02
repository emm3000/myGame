import type { FiefChronicle } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type ChronicleState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly chronicle: FiefChronicle; readonly readAt: Date }

export function useChronicle(apiClient: ApiClient, fiefId: string): ChronicleState {
  const [state, setState] = useState<ChronicleState>({ kind: 'loading' })

  useEffect(() => {
    let isCurrent = true
    void apiClient.chronicle(fiefId).then((outcome) => {
      if (!isCurrent) {
        return
      }
      setState(
        outcome.ok
          ? { kind: 'read', chronicle: outcome.value, readAt: new Date() }
          : { kind: 'refused', refusal: outcome.refusal },
      )
    })
    return () => {
      isCurrent = false
    }
  }, [apiClient, fiefId])

  return state
}

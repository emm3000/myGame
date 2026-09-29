import type { FiefOverview } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type MapFiefState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly overview: FiefOverview }

export interface MapFief {
  readonly state: MapFiefState
  readonly adopt: (overview: FiefOverview) => void
}

export function useMapFief(apiClient: ApiClient): MapFief {
  const [state, setState] = useState<MapFiefState>({ kind: 'loading' })

  useEffect(() => {
    let isCurrent = true
    void apiClient.fief().then((outcome) => {
      if (!isCurrent) {
        return
      }
      setState(
        outcome.ok
          ? { kind: 'read', overview: outcome.value }
          : { kind: 'refused', refusal: outcome.refusal },
      )
    })
    return () => {
      isCurrent = false
    }
  }, [apiClient])

  return { state, adopt: (overview) => setState({ kind: 'read', overview }) }
}

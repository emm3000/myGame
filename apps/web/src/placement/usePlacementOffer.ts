import { useEffect, useState } from 'react'
import type { ApiClient } from '../api/apiClient'

export type PlacementOfferState = 'hidden' | 'offered' | 'asking'

export function usePlacementOffer(apiClient: ApiClient): PlacementOfferState {
  const [offer, setOffer] = useState<PlacementOfferState>('hidden')

  useEffect(() => {
    let isCurrent = true
    void apiClient.placement().then((outcome) => {
      if (!isCurrent || !outcome.ok) {
        return
      }
      setOffer(outcome.value.kind === 'closed' ? 'hidden' : outcome.value.kind)
    })
    return () => {
      isCurrent = false
    }
  }, [apiClient])

  return offer
}

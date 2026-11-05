import type { Reviews } from '@mygame/contracts'
import { useCallback, useEffect, useState } from 'react'
import type { ApiClient } from '../api/apiClient'

export type ReviewsState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused' }
  | { readonly kind: 'read'; readonly reviews: Reviews }

export interface ReviewsHandle {
  readonly state: ReviewsState
  readonly reread: () => Promise<void>
}

export function useReviews(apiClient: ApiClient): ReviewsHandle {
  const [state, setState] = useState<ReviewsState>({ kind: 'loading' })

  const reread = useCallback(async (): Promise<void> => {
    const outcome = await apiClient.reviews()
    setState(outcome.ok ? { kind: 'read', reviews: outcome.value } : { kind: 'refused' })
  }, [apiClient])

  useEffect(() => {
    void reread()
  }, [reread])

  return { state, reread }
}

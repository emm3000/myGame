import type { TownNewsFeed } from '@mygame/contracts'
import { useCallback, useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type TownNewsState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly feed: TownNewsFeed; readonly receivedAt: Date }

export interface TownNewsHandle {
  readonly state: TownNewsState
  readonly reread: () => void
}

export function useTownNews(apiClient: ApiClient): TownNewsHandle {
  const [state, setState] = useState<TownNewsState>({ kind: 'loading' })

  const reread = useCallback((): void => {
    void apiClient.townNews().then((outcome) => {
      setState(
        outcome.ok
          ? { kind: 'read', feed: outcome.value, receivedAt: new Date() }
          : { kind: 'refused', refusal: outcome.refusal },
      )
    })
  }, [apiClient])

  useEffect(() => {
    reread()
  }, [reread])

  return { state, reread }
}

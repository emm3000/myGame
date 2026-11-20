import { useCallback, useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal, TextRead } from '../api/apiClient'

export type OpenTextState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly read: TextRead }

export interface OpenTextHandle {
  readonly state: OpenTextState
  readonly reread: () => void
}

export function useOpenText(apiClient: ApiClient, textId: string): OpenTextHandle {
  const [state, setState] = useState<OpenTextState>({ kind: 'loading' })

  const reread = useCallback((): void => {
    void apiClient.text(textId).then((outcome) => {
      setState(
        outcome.ok
          ? { kind: 'read', read: outcome.value }
          : { kind: 'refused', refusal: outcome.refusal },
      )
    })
  }, [apiClient, textId])

  useEffect(() => {
    reread()
  }, [reread])

  return { state, reread }
}

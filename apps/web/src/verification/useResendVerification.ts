import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type ResendState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'sending' }
  | { readonly kind: 'sent' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }

export interface ResendVerification {
  readonly state: ResendState
  readonly resend: () => void
}

export function useResendVerification(apiClient: ApiClient): ResendVerification {
  const [state, setState] = useState<ResendState>({ kind: 'idle' })
  const isInFlight = useRef(false)

  const resend = useCallback(async (): Promise<void> => {
    if (isInFlight.current) {
      return
    }
    isInFlight.current = true
    setState({ kind: 'sending' })
    const refusal = await apiClient.resendVerification()
    isInFlight.current = false
    setState(refusal === undefined ? { kind: 'sent' } : { kind: 'refused', refusal })
  }, [apiClient])

  return { state, resend: () => void resend() }
}

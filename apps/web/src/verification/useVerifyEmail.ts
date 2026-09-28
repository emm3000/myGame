import { useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type VerifyEmailState =
  | { readonly kind: 'verifying' }
  | { readonly kind: 'verified' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }

const missingToken: VerifyEmailState = { kind: 'refused', refusal: 'TokenInvalid' }

export function useVerifyEmail(apiClient: ApiClient, token: string | undefined): VerifyEmailState {
  const [state, setState] = useState<VerifyEmailState>(
    token === undefined ? missingToken : { kind: 'verifying' },
  )
  const hasPosted = useRef(false)

  useEffect(() => {
    if (token === undefined || hasPosted.current) {
      return
    }
    hasPosted.current = true
    void apiClient.verifyEmail(token).then((refusal) => {
      setState(refusal === undefined ? { kind: 'verified' } : { kind: 'refused', refusal })
    })
  }, [apiClient, token])

  return state
}

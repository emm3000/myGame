import type { Report } from '@mygame/contracts/town'
import { useCallback, useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type ReportState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly report: Report; readonly receivedAt: Date }

export interface ReportHandle {
  readonly state: ReportState
  readonly reread: () => void
}

export function useReport(apiClient: ApiClient): ReportHandle {
  const [state, setState] = useState<ReportState>({ kind: 'loading' })

  const reread = useCallback((): void => {
    void apiClient.report().then((outcome) => {
      setState(
        outcome.ok
          ? { kind: 'read', report: outcome.value, receivedAt: new Date() }
          : { kind: 'refused', refusal: outcome.refusal },
      )
    })
  }, [apiClient])

  useEffect(() => {
    reread()
  }, [reread])

  return { state, reread }
}

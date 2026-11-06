import type { Report } from '@mygame/contracts/town'
import { useCallback, useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { longestTimeoutMs } from '../time/longestTimeoutMs'

export type ReportState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly report: Report; readonly receivedAt: Date }

export interface ReportHandle {
  readonly state: ReportState
  readonly reread: () => void
}

function nextReviewDelayMsOf(state: ReportState): number | undefined {
  if (state.kind !== 'read' || state.report.dueCount > 0 || state.report.nextDueAt === null) {
    return undefined
  }
  const delayMs = Date.parse(state.report.nextDueAt) - state.receivedAt.getTime()
  return delayMs > 0 ? Math.min(delayMs, longestTimeoutMs) : undefined
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

  useEffect(() => {
    const delayMs = nextReviewDelayMsOf(state)
    if (delayMs === undefined) {
      return
    }
    const timer = setTimeout(reread, delayMs)
    return () => clearTimeout(timer)
  }, [state, reread])

  return { state, reread }
}

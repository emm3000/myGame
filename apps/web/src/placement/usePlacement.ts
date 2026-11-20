import type { Placement, PlacementAnswers } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiOutcome } from '../api/apiClient'

export type PlacementView =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'read'; readonly placement: Placement }

export type PlacementAction = 'begin' | 'skip' | 'answers'

export interface PlacementHandle {
  readonly view: PlacementView
  readonly waiting: PlacementAction | undefined
  readonly reread: () => void
  readonly begin: () => void
  readonly skip: () => void
  readonly send: (answers: PlacementAnswers) => void
}

export function usePlacement(apiClient: ApiClient): PlacementHandle {
  const [view, setView] = useState<PlacementView>({ kind: 'loading' })
  const [waiting, setWaiting] = useState<PlacementAction | undefined>(undefined)
  const isInFlight = useRef(false)

  const read = useCallback(async (): Promise<void> => {
    setView({ kind: 'loading' })
    const outcome = await apiClient.placement()
    setView(outcome.ok ? { kind: 'read', placement: outcome.value } : { kind: 'failed' })
  }, [apiClient])

  useEffect(() => {
    void read()
  }, [read])

  const change = (action: PlacementAction, call: () => Promise<ApiOutcome<Placement>>): void => {
    if (isInFlight.current) {
      return
    }
    isInFlight.current = true
    setWaiting(action)
    void call().then(async (outcome) => {
      if (outcome.ok) {
        setView({ kind: 'read', placement: outcome.value })
      } else {
        await read()
      }
      isInFlight.current = false
      setWaiting(undefined)
    })
  }

  return {
    view,
    waiting,
    reread: () => void read(),
    begin: () => change('begin', apiClient.beginPlacement),
    skip: () => change('skip', apiClient.skipPlacement),
    send: (answers) => change('answers', () => apiClient.answerPlacement(answers)),
  }
}

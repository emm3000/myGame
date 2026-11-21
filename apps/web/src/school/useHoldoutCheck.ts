import type { HoldoutCheckAnswers, HoldoutCheckRequest, HoldoutChecks } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, HoldoutCheckChange, HoldoutCheckRefusal } from '../api/apiClient'

type AskingCheck = Extract<HoldoutChecks['checks'][number], { readonly kind: 'asking' }>

export type HoldoutCheckView =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'notOpen' }
  | { readonly kind: 'due'; readonly check: HoldoutCheckRequest }
  | { readonly kind: 'asking'; readonly check: AskingCheck }
  | { readonly kind: 'done' }
  | { readonly kind: 'skipped' }

export type HoldoutCheckAction = 'begin' | 'skip' | 'answers'

export type HoldoutCheckAlert = 'notOpen' | 'invalidAnswers' | 'unreachable'

export interface HoldoutCheckHandle {
  readonly view: HoldoutCheckView
  readonly waiting: HoldoutCheckAction | undefined
  readonly alert: HoldoutCheckAlert | undefined
  readonly reread: () => void
  readonly begin: () => void
  readonly skip: () => void
  readonly send: (answers: HoldoutCheckAnswers) => void
}

const viewOf = ({ checks }: HoldoutChecks, wanted: HoldoutCheckRequest): HoldoutCheckView => {
  const check = checks.find(({ band, week }) => band === wanted.band && week === wanted.week)
  if (check === undefined) {
    return { kind: 'notOpen' }
  }
  return check.kind === 'due' ? { kind: 'due', check: wanted } : { kind: 'asking', check }
}

const changedViewOf = (
  action: HoldoutCheckAction,
  checks: HoldoutChecks,
  wanted: HoldoutCheckRequest,
): HoldoutCheckView => {
  switch (action) {
    case 'begin':
      return viewOf(checks, wanted)
    case 'skip':
      return { kind: 'skipped' }
    case 'answers':
      return { kind: 'done' }
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}

const alertOf = (action: HoldoutCheckAction, refusal: HoldoutCheckRefusal): HoldoutCheckAlert =>
  refusal === 'invalidRequest' && action === 'answers' ? 'invalidAnswers' : 'notOpen'

export function useHoldoutCheck(
  apiClient: ApiClient,
  wanted: HoldoutCheckRequest | undefined,
): HoldoutCheckHandle {
  const [view, setView] = useState<HoldoutCheckView>({
    kind: wanted === undefined ? 'notOpen' : 'loading',
  })
  const [waiting, setWaiting] = useState<HoldoutCheckAction | undefined>(undefined)
  const [alert, setAlert] = useState<HoldoutCheckAlert | undefined>(undefined)
  const isInFlight = useRef(false)
  const band = wanted?.band
  const week = wanted?.week

  const read = useCallback(async (): Promise<void> => {
    if (band === undefined || week === undefined) {
      return
    }
    setView({ kind: 'loading' })
    const outcome = await apiClient.holdoutChecks()
    setView(outcome.ok ? viewOf(outcome.value, { band, week }) : { kind: 'failed' })
  }, [apiClient, band, week])

  useEffect(() => {
    void read()
  }, [read])

  const apply = (action: HoldoutCheckAction, change: HoldoutCheckChange): void => {
    if (wanted === undefined) {
      return
    }
    if (change.kind === 'changed') {
      setView(changedViewOf(action, change.checks, wanted))
      return
    }
    setAlert(change.kind === 'refused' ? alertOf(action, change.refusal) : 'unreachable')
  }

  const change = (
    action: HoldoutCheckAction,
    call: (check: HoldoutCheckRequest) => Promise<HoldoutCheckChange>,
  ): void => {
    if (wanted === undefined || isInFlight.current) {
      return
    }
    isInFlight.current = true
    setWaiting(action)
    setAlert(undefined)
    void call(wanted).then((answer) => {
      apply(action, answer)
      isInFlight.current = false
      setWaiting(undefined)
    })
  }

  return {
    view,
    waiting,
    alert,
    reread: () => void read(),
    begin: () => change('begin', apiClient.beginHoldoutCheck),
    skip: () => change('skip', apiClient.skipHoldoutCheck),
    send: (answers) => change('answers', (check) => apiClient.answerHoldoutCheck(check, answers)),
  }
}

import type { TipKind, TownOverview } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import type { TownGoal } from './TownGoal'

export interface TownGuidance {
  readonly goal: TownGoal | null
  readonly tip: TipKind | null
  readonly closeGoal: () => void
  readonly closeTip: (tip: TipKind) => void
}

type GuidanceClose = { readonly kind: 'goal' } | { readonly kind: 'tip'; readonly tip: TipKind }

const closeKeyOf = (close: GuidanceClose): string =>
  close.kind === 'goal' ? 'goal' : `tip:${close.tip}`

const goalOf = ({ nextStep }: TownOverview): TownGoal | null =>
  nextStep.kind === 'caughtUp' ? nextStep.goal : null

function useGuidanceCloses(
  apiClient: ApiClient,
  readSequence: number,
): (close: GuidanceClose) => Promise<void> {
  const unsent = useRef(new Map<string, GuidanceClose>())

  const send = useCallback(
    async (close: GuidanceClose): Promise<void> => {
      const key = closeKeyOf(close)
      unsent.current.delete(key)
      const refusal: ApiRefusal | undefined =
        close.kind === 'goal'
          ? await apiClient.dismissGuidance()
          : await apiClient.markTipSeen(close.tip)
      if (refusal !== undefined) {
        unsent.current.set(key, close)
      }
    },
    [apiClient],
  )

  const resentAtRead = useRef(readSequence)
  useEffect(() => {
    if (resentAtRead.current === readSequence) {
      return
    }
    resentAtRead.current = readSequence
    for (const close of [...unsent.current.values()]) {
      void send(close)
    }
  }, [readSequence, send])

  return send
}

export function useTownGuidance(
  apiClient: ApiClient,
  overview: TownOverview,
  readSequence: number,
): TownGuidance {
  const closedKeys = useRef(new Set<string>())
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set())
  const send = useGuidanceCloses(apiClient, readSequence)

  const close = useCallback(
    (guidance: GuidanceClose): void => {
      const key = closeKeyOf(guidance)
      if (closedKeys.current.has(key)) {
        return
      }
      closedKeys.current.add(key)
      setClosed(new Set(closedKeys.current))
      void send(guidance)
    },
    [send],
  )

  const { tip } = overview
  return {
    goal: closed.has('goal') ? null : goalOf(overview),
    tip: tip === null || closed.has(closeKeyOf({ kind: 'tip', tip })) ? null : tip,
    closeGoal: () => close({ kind: 'goal' }),
    closeTip: (shown) => close({ kind: 'tip', tip: shown }),
  }
}

import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import {
  battleRemainingSecondsAt,
  incomingCargoRemainingSecondsAt,
  type LiveFief,
  liveFiefAt,
  marchRemainingSecondsAt,
  recruitOrderRemainingSecondsAt,
  seasonRemainingSecondsAt,
  slotRemainingSecondsAt,
  studyRemainingSecondsAt,
} from './liveFief'
import { repaintDelayMsOf } from './repaintDelayMsOf'

export type LiveFiefState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'live'; readonly fief: LiveFief }

export interface LiveFiefHandle {
  readonly state: LiveFiefState
  readonly adopt: (overview: FiefOverview) => void
}

interface LastRead {
  readonly overview: FiefOverview
  readonly receivedAtMs: number
}

const rereadIntervalMs = 60_000
const focusFloorMs = 1000
const longestTimeoutMs = 2_147_483_647

const elapsedSecondsSince = (receivedAtMs: number, nowMs: number): number =>
  Math.max(0, (nowMs - receivedAtMs) / 1000)

function useRereadPolicy(lastRead: LastRead | undefined, read: () => void): void {
  useEffect(() => {
    const readOnFocus = (): void => {
      if (lastRead !== undefined && Date.now() - lastRead.receivedAtMs < focusFloorMs) {
        return
      }
      read()
    }
    window.addEventListener('focus', readOnFocus)
    return () => window.removeEventListener('focus', readOnFocus)
  }, [lastRead, read])

  useEffect(() => {
    if (lastRead === undefined) {
      return
    }
    const timers = [setTimeout(read, rereadIntervalMs)]
    const countdowns = [
      slotRemainingSecondsAt(lastRead.overview, 0),
      studyRemainingSecondsAt(lastRead.overview, 0),
      seasonRemainingSecondsAt(lastRead.overview, 0),
      recruitOrderRemainingSecondsAt(lastRead.overview, 0),
      marchRemainingSecondsAt(lastRead.overview, 0),
      battleRemainingSecondsAt(lastRead.overview, 0),
      incomingCargoRemainingSecondsAt(lastRead.overview, 0),
    ]
    for (const remainingSeconds of countdowns.filter((seconds) => seconds > 0)) {
      timers.push(setTimeout(read, Math.min(remainingSeconds * 1000, longestTimeoutMs)))
    }
    return () => {
      for (const timer of timers) {
        clearTimeout(timer)
      }
    }
  }, [lastRead, read])
}

function useDisplayClock(lastRead: LastRead | undefined): number {
  const [nowMs, setNowMs] = useState(Date.now)
  useEffect(() => {
    if (lastRead === undefined) {
      return
    }
    let repaint: ReturnType<typeof setTimeout>
    const scheduleRepaint = (): void => {
      const elapsedSeconds = elapsedSecondsSince(lastRead.receivedAtMs, Date.now())
      repaint = setTimeout(
        () => {
          setNowMs(Date.now())
          scheduleRepaint()
        },
        repaintDelayMsOf(liveFiefAt(lastRead.overview, elapsedSeconds)),
      )
    }
    scheduleRepaint()
    return () => clearTimeout(repaint)
  }, [lastRead])
  return nowMs
}

export type Reread = (previous: FiefOverview, next: FiefOverview) => void

export function useLiveFief(
  apiClient: ApiClient,
  fiefId: string,
  onReread: Reread,
): LiveFiefHandle {
  const [lastRead, setLastRead] = useState<LastRead>()
  const [refusal, setRefusal] = useState<ApiRefusal>()
  const isReading = useRef(false)
  const lastOverview = useRef<FiefOverview>(undefined)
  const rereadListener = useRef(onReread)
  rereadListener.current = onReread

  const read = useCallback(async (): Promise<void> => {
    if (isReading.current) {
      return
    }
    isReading.current = true
    const outcome = await apiClient.fief(fiefId)
    isReading.current = false
    if (outcome.ok) {
      const previous = lastOverview.current
      lastOverview.current = outcome.value
      if (previous !== undefined) {
        rereadListener.current(previous, outcome.value)
      }
      setLastRead({ overview: outcome.value, receivedAtMs: Date.now() })
      setRefusal(undefined)
      return
    }
    setRefusal(outcome.refusal)
  }, [apiClient, fiefId])

  const adopt = useCallback((overview: FiefOverview): void => {
    lastOverview.current = overview
    setLastRead({ overview, receivedAtMs: Date.now() })
    setRefusal(undefined)
  }, [])

  useEffect(() => {
    void read()
  }, [read])
  useRereadPolicy(lastRead, read)
  const nowMs = useDisplayClock(lastRead)

  if (lastRead !== undefined) {
    const elapsedSeconds = elapsedSecondsSince(lastRead.receivedAtMs, nowMs)
    const fief = liveFiefAt(lastRead.overview, elapsedSeconds)
    return { state: { kind: 'live', fief }, adopt }
  }
  return {
    state: refusal === undefined ? { kind: 'loading' } : { kind: 'refused', refusal },
    adopt,
  }
}

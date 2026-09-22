import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { type LiveFief, liveFiefAt, slotRemainingSecondsAt } from './liveFief'

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
const displayTickMs = 1000
const focusFloorMs = 1000

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
    const remainingSeconds = slotRemainingSecondsAt(lastRead.overview, 0)
    if (remainingSeconds > 0) {
      timers.push(setTimeout(read, remainingSeconds * 1000))
    }
    return () => {
      for (const timer of timers) {
        clearTimeout(timer)
      }
    }
  }, [lastRead, read])
}

function useDisplayClock(isLive: boolean): number {
  const [nowMs, setNowMs] = useState(Date.now)
  useEffect(() => {
    if (!isLive) {
      return
    }
    const ticker = setInterval(() => setNowMs(Date.now()), displayTickMs)
    return () => clearInterval(ticker)
  }, [isLive])
  return nowMs
}

export function useLiveFief(apiClient: ApiClient): LiveFiefHandle {
  const [lastRead, setLastRead] = useState<LastRead>()
  const [refusal, setRefusal] = useState<ApiRefusal>()
  const isReading = useRef(false)

  const read = useCallback(async (): Promise<void> => {
    if (isReading.current) {
      return
    }
    isReading.current = true
    const outcome = await apiClient.fief()
    isReading.current = false
    if (outcome.ok) {
      setLastRead({ overview: outcome.value, receivedAtMs: Date.now() })
      setRefusal(undefined)
      return
    }
    setRefusal(outcome.refusal)
  }, [apiClient])

  const adopt = useCallback((overview: FiefOverview): void => {
    setLastRead({ overview, receivedAtMs: Date.now() })
    setRefusal(undefined)
  }, [])

  useEffect(() => {
    void read()
  }, [read])
  useRereadPolicy(lastRead, read)
  const nowMs = useDisplayClock(lastRead !== undefined)

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

import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { type LiveFief, liveFiefAt, slotRemainingSecondsAt } from './liveFief'

export type LiveFiefState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'live'; readonly fief: LiveFief; readonly slotTotalSeconds: number }

interface LastRead {
  readonly overview: FiefOverview
  readonly receivedAtMs: number
}

const rereadIntervalMs = 60_000
const displayTickMs = 1000

const elapsedSecondsSince = (receivedAtMs: number, nowMs: number): number =>
  Math.max(0, (nowMs - receivedAtMs) / 1000)

function useRereadPolicy(lastRead: LastRead | undefined, read: () => void): void {
  useEffect(() => {
    window.addEventListener('focus', read)
    return () => window.removeEventListener('focus', read)
  }, [read])

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

interface FirstSightOfSlot {
  readonly finishesAt: string
  readonly remainingSeconds: number
}

function useSlotTotalSeconds(lastRead: LastRead | undefined): number {
  const firstSight = useRef<FirstSightOfSlot>(undefined)
  if (lastRead === undefined || lastRead.overview.slot.kind === 'idle') {
    return 0
  }
  const { finishesAt } = lastRead.overview.slot
  if (firstSight.current?.finishesAt !== finishesAt) {
    firstSight.current = {
      finishesAt,
      remainingSeconds: slotRemainingSecondsAt(lastRead.overview, 0),
    }
  }
  return firstSight.current.remainingSeconds
}

export function useLiveFief(apiClient: ApiClient): LiveFiefState {
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

  useEffect(() => {
    void read()
  }, [read])
  useRereadPolicy(lastRead, read)
  const nowMs = useDisplayClock(lastRead !== undefined)
  const slotTotalSeconds = useSlotTotalSeconds(lastRead)

  if (lastRead !== undefined) {
    const elapsedSeconds = elapsedSecondsSince(lastRead.receivedAtMs, nowMs)
    return { kind: 'live', fief: liveFiefAt(lastRead.overview, elapsedSeconds), slotTotalSeconds }
  }
  return refusal === undefined ? { kind: 'loading' } : { kind: 'refused', refusal }
}

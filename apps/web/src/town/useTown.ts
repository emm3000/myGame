import type { TownOverview } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { longestTimeoutMs } from '../time/longestTimeoutMs'
import { jobNextInstantOf } from './jobNextInstantOf'
import { type LiveTown, liveTownAt, secondsUntil } from './liveTown'
import { nothingRegistered, type Registered, registeredBetween } from './registeredBetween'
import { townRepaintDelayMsOf } from './townRepaintDelayMsOf'

export type TownState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'noTown' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | {
      readonly kind: 'live'
      readonly town: LiveTown
      readonly registered: Registered
      readonly readSequence: number
    }

export interface TownHandle {
  readonly state: TownState
  readonly adopt: (overview: TownOverview) => void
  readonly reread: () => void
}

interface LastRead {
  readonly overview: TownOverview
  readonly receivedAtMs: number
  readonly registered: Registered
  readonly readSequence: number
}

const rereadIntervalMs = 60_000
const focusFloorMs = 1000

const elapsedSecondsSince = (receivedAtMs: number, nowMs: number): number =>
  Math.max(0, (nowMs - receivedAtMs) / 1000)

const slotFinishSecondsOf = (overview: TownOverview): number =>
  overview.work.slot === null ? 0 : secondsUntil(overview.work.slot.finishesAt, overview, 0)

const lessonFinishSecondsOf = (overview: TownOverview): number =>
  overview.lessonSlot === null ? 0 : secondsUntil(overview.lessonSlot.finishesAt, overview, 0)

const hiringEndSecondsOf = (overview: TownOverview): number =>
  overview.hiring.order === null ? 0 : secondsUntil(overview.hiring.order.endsAt, overview, 0)

const jobNextSecondsOf = (overview: TownOverview): number =>
  overview.job === null ? 0 : secondsUntil(jobNextInstantOf(overview.job), overview, 0)

const nextDueSecondsOf = (overview: TownOverview): number =>
  overview.nextDueAt === null ? 0 : secondsUntil(overview.nextDueAt, overview, 0)

const seasonEndSecondsOf = (overview: TownOverview): number =>
  overview.season === null ? 0 : secondsUntil(overview.season.endsAt, overview, 0)

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
    const finishSeconds = [
      slotFinishSecondsOf(lastRead.overview),
      lessonFinishSecondsOf(lastRead.overview),
      hiringEndSecondsOf(lastRead.overview),
      jobNextSecondsOf(lastRead.overview),
      nextDueSecondsOf(lastRead.overview),
      seasonEndSecondsOf(lastRead.overview),
    ]
    for (const seconds of finishSeconds.filter((seconds) => seconds > 0)) {
      timers.push(setTimeout(read, Math.min(seconds * 1000, longestTimeoutMs)))
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
        townRepaintDelayMsOf(liveTownAt(lastRead.overview, elapsedSeconds)),
      )
    }
    scheduleRepaint()
    return () => clearTimeout(repaint)
  }, [lastRead])
  return nowMs
}

export function useTown(apiClient: ApiClient): TownHandle {
  const [lastRead, setLastRead] = useState<LastRead>()
  const [refusal, setRefusal] = useState<ApiRefusal>()
  const isReading = useRef(false)

  const adopt = useCallback((overview: TownOverview): void => {
    const receivedAtMs = Date.now()
    setLastRead((held) => ({
      overview,
      receivedAtMs,
      registered:
        held === undefined ? nothingRegistered : registeredBetween(held.overview, overview),
      readSequence: (held?.readSequence ?? 0) + 1,
    }))
    setRefusal(undefined)
  }, [])

  const read = useCallback(async (): Promise<void> => {
    if (isReading.current) {
      return
    }
    isReading.current = true
    const outcome = await apiClient.town()
    isReading.current = false
    if (outcome.ok) {
      adopt(outcome.value)
      return
    }
    setRefusal(outcome.refusal)
  }, [apiClient, adopt])

  useEffect(() => {
    void read()
  }, [read])
  useRereadPolicy(lastRead, read)
  const nowMs = useDisplayClock(lastRead)
  const reread = useCallback((): void => {
    void read()
  }, [read])

  if (refusal === 'TownNotFound') {
    return { state: { kind: 'noTown' }, adopt, reread }
  }
  if (lastRead !== undefined) {
    const elapsedSeconds = elapsedSecondsSince(lastRead.receivedAtMs, nowMs)
    return {
      state: {
        kind: 'live',
        town: liveTownAt(lastRead.overview, elapsedSeconds),
        registered: lastRead.registered,
        readSequence: lastRead.readSequence,
      },
      adopt,
      reread,
    }
  }
  return {
    state: refusal === undefined ? { kind: 'loading' } : { kind: 'refused', refusal },
    adopt,
    reread,
  }
}

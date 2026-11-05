import type { Reviews } from '@mygame/contracts'
import { useCallback, useEffect, useState } from 'react'
import type { ApiClient } from '../api/apiClient'

export type ReviewsState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused' }
  | { readonly kind: 'read'; readonly reviews: Reviews; readonly at: Date }

export interface ReviewsHandle {
  readonly state: ReviewsState
  readonly reread: () => Promise<void>
}

interface LastRead {
  readonly reviews: Reviews
  readonly receivedAtMs: number
}

const repaintMs = 60_000

const nextReviewDelayMsOf = ({ due, nextDueAt, readAt }: Reviews): number | undefined =>
  due.length > 0 || nextDueAt === null
    ? undefined
    : Math.max(0, Date.parse(nextDueAt) - Date.parse(readAt))

function useNextReviewRead(lastRead: LastRead | undefined, reread: () => Promise<void>): void {
  useEffect(() => {
    const delayMs = lastRead === undefined ? undefined : nextReviewDelayMsOf(lastRead.reviews)
    if (delayMs === undefined) {
      return
    }
    const timer = setTimeout(() => void reread(), delayMs)
    return () => clearTimeout(timer)
  }, [lastRead, reread])
}

function useDisplayClock(lastRead: LastRead | undefined): number {
  const [nowMs, setNowMs] = useState(Date.now)
  useEffect(() => {
    if (lastRead === undefined) {
      return
    }
    let repaint: ReturnType<typeof setTimeout>
    const scheduleRepaint = (): void => {
      repaint = setTimeout(() => {
        setNowMs(Date.now())
        scheduleRepaint()
      }, repaintMs)
    }
    scheduleRepaint()
    return () => clearTimeout(repaint)
  }, [lastRead])
  return nowMs
}

export function useReviews(apiClient: ApiClient): ReviewsHandle {
  const [lastRead, setLastRead] = useState<LastRead>()
  const [isRefused, setIsRefused] = useState(false)

  const reread = useCallback(async (): Promise<void> => {
    const outcome = await apiClient.reviews()
    if (!outcome.ok) {
      setLastRead(undefined)
      setIsRefused(true)
      return
    }
    setLastRead({ reviews: outcome.value, receivedAtMs: Date.now() })
    setIsRefused(false)
  }, [apiClient])

  useEffect(() => {
    void reread()
  }, [reread])
  useNextReviewRead(lastRead, reread)
  const nowMs = useDisplayClock(lastRead)

  if (lastRead !== undefined) {
    const elapsedMs = Math.max(0, nowMs - lastRead.receivedAtMs)
    const at = new Date(Date.parse(lastRead.reviews.readAt) + elapsedMs)
    return { state: { kind: 'read', reviews: lastRead.reviews, at }, reread }
  }
  return { state: isRefused ? { kind: 'refused' } : { kind: 'loading' }, reread }
}

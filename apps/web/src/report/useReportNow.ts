import { useEffect, useState } from 'react'
import { elapsedMsSince } from '../time/elapsedMsSince'

const untilLocalMidnightMsOf = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate() + 1).getTime() -
  instant.getTime()

export function useReportNow(readAt: string, receivedAtMs: number): Date {
  const [turnedAtMs, setTurnedAtMs] = useState(receivedAtMs)
  const nowMs = Date.parse(readAt) + elapsedMsSince(receivedAtMs, turnedAtMs)
  useEffect(() => {
    const timer = setTimeout(
      () => setTurnedAtMs(Date.now()),
      untilLocalMidnightMsOf(new Date(nowMs)),
    )
    return () => clearTimeout(timer)
  }, [nowMs])
  useEffect(() => {
    const turnWhenVisible = (): void => {
      if (document.visibilityState !== 'visible') {
        return
      }
      setTurnedAtMs(Date.now())
    }
    document.addEventListener('visibilitychange', turnWhenVisible)
    return () => document.removeEventListener('visibilitychange', turnWhenVisible)
  }, [])
  return new Date(nowMs)
}

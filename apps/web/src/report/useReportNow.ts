import { useEffect, useState } from 'react'

const untilLocalMidnightMsOf = (instant: Date): number =>
  new Date(instant.getFullYear(), instant.getMonth(), instant.getDate() + 1).getTime() -
  instant.getTime()

export function useReportNow(readAt: string, receivedAtMs: number): Date {
  const [turnedAtMs, setTurnedAtMs] = useState(receivedAtMs)
  const nowMs = Date.parse(readAt) + Math.max(0, turnedAtMs - receivedAtMs)
  useEffect(() => {
    const timer = setTimeout(
      () => setTurnedAtMs(Date.now()),
      untilLocalMidnightMsOf(new Date(nowMs)),
    )
    return () => clearTimeout(timer)
  }, [nowMs])
  return new Date(nowMs)
}

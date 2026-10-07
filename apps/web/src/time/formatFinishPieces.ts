import { formatClock } from './formatClock'
import { formatTimeLeft } from './formatTimeLeft'

const secondsPerHour = 3600

export function formatFinishPieces(remainingSeconds: number, now: Date): ReadonlyArray<string> {
  const timeLeft = formatTimeLeft(remainingSeconds)
  if (Math.ceil(remainingSeconds) <= secondsPerHour) {
    return [timeLeft]
  }
  const finish = new Date(now.getTime() + remainingSeconds * 1000)
  return [timeLeft, formatClock(finish, now)]
}

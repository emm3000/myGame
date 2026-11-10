import type { LiveTown } from './liveTown'

const minuteMs = 60_000
const secondMs = 1000
const lastMinuteSeconds = 60

const countdownsOf = (town: LiveTown): ReadonlyArray<number> => [
  ...(town.slot === null ? [] : [town.slot.remainingSeconds]),
  ...town.waitingList.map(({ remainingSeconds }) => remainingSeconds),
  ...(town.lessonSlot === null ? [] : [town.lessonSlot.remainingSeconds]),
  ...(town.hiringOrder === null ? [] : [town.hiringOrder.remainingSeconds]),
  ...(town.nextDueSeconds === null ? [] : [town.nextDueSeconds]),
]

export function townRepaintDelayMsOf(town: LiveTown): number {
  const nearestSeconds = Math.min(...countdownsOf(town).filter((seconds) => seconds > 0))
  const countdownDelayMs =
    nearestSeconds <= lastMinuteSeconds ? secondMs : (nearestSeconds - lastMinuteSeconds) * secondMs
  return Math.min(minuteMs, countdownDelayMs)
}

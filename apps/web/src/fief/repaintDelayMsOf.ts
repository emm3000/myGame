import type { LiveFief } from './liveFief'
import { marchCountdownOf } from './marchCountdownOf'

const minuteMs = 60_000
const secondMs = 1000
const lastMinuteSeconds = 60

const marchCountdownsOf = (fief: LiveFief): ReadonlyArray<number> =>
  fief.march === null || fief.overview.march === null
    ? []
    : [marchCountdownOf(fief.march, fief.overview.march).remainingSeconds]

const countdownsOf = (fief: LiveFief): ReadonlyArray<number> => [
  fief.slotRemainingSeconds,
  fief.studyRemainingSeconds,
  fief.seasonRemainingSeconds,
  fief.incomingCargoRemainingSeconds,
  ...fief.waitingUpgrades.map(({ remainingSeconds }) => remainingSeconds),
  ...(fief.recruitOrder === null ? [] : [fief.recruitOrder.remainingSeconds]),
  ...marchCountdownsOf(fief),
]

const changesOf = (fief: LiveFief): ReadonlyArray<number> => [
  ...(fief.recruitOrder === null ? [] : [fief.recruitOrder.nextUnitRemainingSeconds]),
  ...(fief.march === null
    ? []
    : [
        fief.march.arrivalSeconds - fief.march.elapsedSeconds,
        fief.march.leavingSeconds - fief.march.elapsedSeconds,
      ]),
]

const nearestOf = (seconds: ReadonlyArray<number>): number =>
  Math.min(...seconds.filter((value) => value > 0))

const countdownDelayMsOf = (nearestSeconds: number): number =>
  nearestSeconds <= lastMinuteSeconds ? secondMs : (nearestSeconds - lastMinuteSeconds) * secondMs

export function repaintDelayMsOf(fief: LiveFief): number {
  return Math.min(
    minuteMs,
    countdownDelayMsOf(nearestOf(countdownsOf(fief))),
    nearestOf(changesOf(fief)) * secondMs,
  )
}

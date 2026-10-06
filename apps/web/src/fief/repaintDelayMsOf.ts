import type { LiveFief } from './liveFief'

const minuteMs = 60_000
const secondMs = 1000
const lastMinuteSeconds = 60

const countdownsOf = (fief: LiveFief): ReadonlyArray<number> => [
  fief.slotRemainingSeconds,
  fief.studyRemainingSeconds,
  fief.seasonRemainingSeconds,
  fief.incomingCargoRemainingSeconds,
  ...fief.waitingUpgrades.map(({ remainingSeconds }) => remainingSeconds),
  ...(fief.recruitOrder === null
    ? []
    : [fief.recruitOrder.remainingSeconds, fief.recruitOrder.nextUnitRemainingSeconds]),
  ...(fief.march === null
    ? []
    : [fief.march.remainingSeconds, fief.march.arrivalSeconds - fief.march.elapsedSeconds]),
]

const phaseChangesOf = (fief: LiveFief): ReadonlyArray<number> =>
  fief.march === null ? [] : [fief.march.leavingSeconds - fief.march.elapsedSeconds]

const nearestOf = (seconds: ReadonlyArray<number>): number =>
  Math.min(...seconds.filter((value) => value > 0))

const countdownDelayMsOf = (nearestSeconds: number): number =>
  nearestSeconds <= lastMinuteSeconds ? secondMs : (nearestSeconds - lastMinuteSeconds) * secondMs

export function repaintDelayMsOf(fief: LiveFief): number {
  return Math.min(
    minuteMs,
    countdownDelayMsOf(nearestOf(countdownsOf(fief))),
    nearestOf(phaseChangesOf(fief)) * secondMs,
  )
}

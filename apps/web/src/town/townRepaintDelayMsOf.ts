import { BuildingKindSchema, HireKindSchema } from '@mygame/contracts'
import { firstHireEntry, hireReadySecondsOf } from './hireCardOf'
import type { LiveTown } from './liveTown'
import { placeReadySecondsOf } from './placeCardOf'

const minuteMs = 60_000
const secondMs = 1000
const lastMinuteSeconds = 60

const readyMinutesOf = (town: LiveTown): ReadonlyArray<number | null> => [
  ...BuildingKindSchema.options.map((place) => placeReadySecondsOf(place, town)),
  ...HireKindSchema.options.map((hire) => hireReadySecondsOf(hire, firstHireEntry, town)),
]

const countdownsOf = (town: LiveTown): ReadonlyArray<number | null> => [
  town.slot?.remainingSeconds ?? null,
  ...town.waitingList.map(({ remainingSeconds }) => remainingSeconds),
  town.lessonSlot?.remainingSeconds ?? null,
  town.hiringOrder?.remainingSeconds ?? null,
  town.job?.remainingSeconds ?? null,
  town.nextDueSeconds,
  town.seasonRemainingSeconds,
  ...readyMinutesOf(town),
]

const isRunning = (seconds: number | null): seconds is number => seconds !== null && seconds > 0

export function townRepaintDelayMsOf(town: LiveTown): number {
  const nearestSeconds = Math.min(...countdownsOf(town).filter(isRunning))
  const countdownDelayMs =
    nearestSeconds <= lastMinuteSeconds ? secondMs : (nearestSeconds - lastMinuteSeconds) * secondMs
  return Math.min(minuteMs, countdownDelayMs)
}

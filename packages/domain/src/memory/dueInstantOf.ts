import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import { Instant } from '../time/Instant'
import type { MemoryCard, RecalledMemory } from './MemoryCard'
import type { MemoryTerms } from './MemoryTerms'

const MILLISECONDS_PER_SECOND = 1_000

const SECONDS_PER_DAY = 86_400

const RETRIEVABILITY_AT_STABILITY = 0.9

const HARD_SINGLE_STEP_FACTOR = 1.5

const secondsAfter = (from: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(from.epochMilliseconds + seconds * MILLISECONDS_PER_SECOND)

const roundedHalfToEven = (value: number): number => {
  const floor = Math.floor(value)
  const fraction = value - floor
  if (fraction !== 0.5) {
    return Math.round(value)
  }
  return floor % 2 === 0 ? floor : floor + 1
}

const reviewIntervalDays = (stability: number, terms: MemoryTerms): number => {
  const decay = -terms.parameters[20]
  const factor = RETRIEVABILITY_AT_STABILITY ** (1 / decay) - 1
  const intervalDays = (stability / factor) * (terms.desiredRetention ** (1 / decay) - 1)
  return Math.min(Math.max(roundedHalfToEven(intervalDays), 1), terms.maximumIntervalDays)
}

const stepDelaySeconds = (
  step: number,
  lastRating: RecalledMemory['lastRating'],
  stepsSeconds: ReadonlyArray<number>,
): number | undefined => {
  const [first, second] = stepsSeconds
  if (lastRating === 'hard' && step === 0 && first !== undefined) {
    return second === undefined ? first * HARD_SINGLE_STEP_FACTOR : (first + second) / 2
  }
  return stepsSeconds[step]
}

export const dueInstantOf = (
  card: MemoryCard,
  terms: MemoryTerms,
): Result<Instant, DomainError> => {
  const stored = card.stored
  if (stored.lastReviewAt === null) {
    return ok(stored.enteredAt)
  }
  if (stored.state === 'review') {
    return ok(
      secondsAfter(
        stored.lastReviewAt,
        reviewIntervalDays(stored.stability, terms) * SECONDS_PER_DAY,
      ),
    )
  }
  const stepsSeconds =
    stored.state === 'learning' ? terms.learningStepsSeconds : terms.relearningStepsSeconds
  const delaySeconds = stepDelaySeconds(stored.step, stored.lastRating, stepsSeconds)
  if (delaySeconds === undefined) {
    return err({ kind: 'UnknownMemoryStep', state: stored.state, step: stored.step })
  }
  return ok(secondsAfter(stored.lastReviewAt, delaySeconds))
}

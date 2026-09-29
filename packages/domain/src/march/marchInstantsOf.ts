import { Instant } from '../time/Instant'
import type { AwayMarch } from './March'

const MILLISECONDS_PER_SECOND = 1_000

const SECONDS_PER_HOUR = 3_600

export type MarchInstants = {
  readonly arrivesAt: Instant
  readonly leavesAt: Instant
  readonly returnsAt: Instant
}

const secondsAfter = (from: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(from.epochMilliseconds + seconds * MILLISECONDS_PER_SECOND)

const recalledInstantsOf = (march: AwayMarch, recalledAt: Instant): MarchInstants => {
  const arrivesAt = Instant.fromEpochMilliseconds(
    Math.min(
      secondsAfter(march.departedAt, march.oneWaySeconds).epochMilliseconds,
      recalledAt.epochMilliseconds,
    ),
  )
  const walkedMilliseconds = arrivesAt.epochMilliseconds - march.departedAt.epochMilliseconds
  return {
    arrivesAt,
    leavesAt: recalledAt,
    returnsAt: Instant.fromEpochMilliseconds(recalledAt.epochMilliseconds + walkedMilliseconds),
  }
}

export const marchInstantsOf = (march: AwayMarch): MarchInstants => {
  if (march.recalledAt !== undefined) {
    return recalledInstantsOf(march, march.recalledAt)
  }
  const arrivesAt = secondsAfter(march.departedAt, march.oneWaySeconds)
  const leavesAt = secondsAfter(arrivesAt, march.stayHours * SECONDS_PER_HOUR)
  const returnsAt = secondsAfter(leavesAt, march.oneWaySeconds)
  return { arrivesAt, leavesAt, returnsAt }
}

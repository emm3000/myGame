import { Instant } from '../time/Instant'
import type { Job } from './Job'

const MILLISECONDS_PER_SECOND = 1_000

const SECONDS_PER_HOUR = 3_600

export type JobInstants = {
  readonly arrivesAt: Instant
  readonly leavesAt: Instant
  readonly returnsAt: Instant
}

const secondsAfter = (from: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(from.epochMilliseconds + seconds * MILLISECONDS_PER_SECOND)

const calledBackInstantsOf = (job: Job, calledBackAt: Instant): JobInstants => {
  const arrivesAt = Instant.fromEpochMilliseconds(
    Math.min(
      secondsAfter(job.sentAt, job.oneWaySeconds).epochMilliseconds,
      calledBackAt.epochMilliseconds,
    ),
  )
  const roadMilliseconds = arrivesAt.epochMilliseconds - job.sentAt.epochMilliseconds
  return {
    arrivesAt,
    leavesAt: calledBackAt,
    returnsAt: Instant.fromEpochMilliseconds(calledBackAt.epochMilliseconds + roadMilliseconds),
  }
}

export const uncalledJobInstantsOf = (job: Job): JobInstants => {
  const arrivesAt = secondsAfter(job.sentAt, job.oneWaySeconds)
  const leavesAt = secondsAfter(arrivesAt, job.hours * SECONDS_PER_HOUR)
  const returnsAt = secondsAfter(leavesAt, job.oneWaySeconds)
  return { arrivesAt, leavesAt, returnsAt }
}

export const jobInstantsOf = (job: Job): JobInstants =>
  job.calledBackAt === undefined
    ? uncalledJobInstantsOf(job)
    : calledBackInstantsOf(job, job.calledBackAt)

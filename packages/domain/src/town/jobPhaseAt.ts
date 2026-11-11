import type { Instant } from '../time/Instant'
import type { Job } from './Job'
import { jobInstantsOf } from './jobInstantsOf'

export type JobPhase = 'outbound' | 'working' | 'returning'

export const jobPhaseAt = (job: Job, at: Instant): JobPhase => {
  const { arrivesAt, leavesAt } = jobInstantsOf(job)
  if (at.epochMilliseconds < arrivesAt.epochMilliseconds) {
    return 'outbound'
  }
  return at.epochMilliseconds < leavesAt.epochMilliseconds ? 'working' : 'returning'
}

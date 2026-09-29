import type { Instant } from '../time/Instant'
import type { AwayMarch } from './March'
import { marchInstantsOf } from './marchInstantsOf'

export type MarchPhase = 'outbound' | 'foraging' | 'returning'

export const marchPhaseAt = (march: AwayMarch, at: Instant): MarchPhase => {
  const { arrivesAt, leavesAt } = marchInstantsOf(march)
  if (at.epochMilliseconds < arrivesAt.epochMilliseconds) {
    return 'outbound'
  }
  if (at.epochMilliseconds < leavesAt.epochMilliseconds) {
    return 'foraging'
  }
  return 'returning'
}

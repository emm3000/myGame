import type { Instant } from '../time/Instant'
import type { HiringOrder } from './HiringOrder'

export const deliveredHiresOf = (order: HiringOrder, at: Instant): number => {
  const elapsedSeconds = Math.max(0, at.secondsSince(order.startedAt))
  return Math.min(order.count, Math.floor(elapsedSeconds / order.secondsPerHire))
}

import type { Instant } from '../time/Instant'
import type { OpenRecruitOrder } from './RecruitOrder'

export const deliveredUnitsOf = (order: OpenRecruitOrder, at: Instant): number => {
  const elapsedSeconds = Math.max(0, at.secondsSince(order.startedAt))
  return Math.min(order.count, Math.floor(elapsedSeconds / order.perUnitSeconds))
}

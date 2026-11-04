import type { Instant } from '../time/Instant'

const MILLISECONDS_PER_DAY = 86_400_000

export const wholeDaysBetween = (earlier: Instant, later: Instant): number =>
  Math.floor((later.epochMilliseconds - earlier.epochMilliseconds) / MILLISECONDS_PER_DAY)

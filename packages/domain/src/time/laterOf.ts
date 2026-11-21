import type { Instant } from './Instant'

export const laterOf = (left: Instant, right: Instant): Instant =>
  left.epochMilliseconds >= right.epochMilliseconds ? left : right

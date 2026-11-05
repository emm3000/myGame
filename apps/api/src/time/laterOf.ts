import type { Instant } from '@mygame/domain'

export const laterOf = (left: Instant, right: Instant): Instant =>
  left.epochMilliseconds >= right.epochMilliseconds ? left : right

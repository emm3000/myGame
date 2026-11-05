import type { Instant } from '@mygame/domain'

type Earned = { readonly lessonId: string; readonly earnedAt: Instant }

export const byEarnedAt = (left: Earned, right: Earned): number =>
  left.earnedAt.epochMilliseconds - right.earnedAt.epochMilliseconds ||
  (left.lessonId < right.lessonId ? -1 : Number(left.lessonId > right.lessonId))

import type { EarnedSkill } from '@mygame/domain'

export const byEarnedAt = (left: EarnedSkill, right: EarnedSkill): number =>
  left.earnedAt.epochMilliseconds - right.earnedAt.epochMilliseconds ||
  (left.lessonId < right.lessonId ? -1 : Number(left.lessonId > right.lessonId))

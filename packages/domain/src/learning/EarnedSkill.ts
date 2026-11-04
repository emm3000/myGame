import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import type { LessonId } from './Lesson'

export type EarnedSkill = {
  readonly lessonId: LessonId
  readonly resource: ResourceKind
  readonly ratePercent: number
  readonly earnedAt: Instant
}

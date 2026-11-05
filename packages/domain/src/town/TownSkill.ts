import type { LessonId } from '../learning/Lesson'
import type { Instant } from '../time/Instant'
import type { ResourceKind } from './ResourceKind'

export type TownSkill = {
  readonly lessonId: LessonId
  readonly resource: ResourceKind
  readonly ratePercent: number
  readonly earnedAt: Instant
}

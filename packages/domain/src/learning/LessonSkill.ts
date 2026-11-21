import type { ResourceKind } from '../town/ResourceKind'

export type LessonSkill = {
  readonly resource: ResourceKind
  readonly ratePercent: number
}

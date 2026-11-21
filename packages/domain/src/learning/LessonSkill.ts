import type { ResourceKind } from '../town/resources/ResourceKind'

export type LessonSkill = {
  readonly resource: ResourceKind
  readonly ratePercent: number
}

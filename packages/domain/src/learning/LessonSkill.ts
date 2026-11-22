import type { ResourceKind } from '#town/resources/domain/ResourceKind'

export type LessonSkill = {
  readonly resource: ResourceKind
  readonly ratePercent: number
}

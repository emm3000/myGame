import type { LessonId } from '../learning/Lesson'
import type { Instant } from '../time/Instant'
import type { BuildingKind } from './BuildingKind'
import type { HireKind } from './HireKind'
import type { ResourceKind } from './ResourceKind'
import type { SiteAddress } from './SiteAddress'
import type { Stocks } from './Stocks'

type Occurred = { readonly occurredAt: Instant }

export type TownEvent =
  | (Occurred & {
      readonly kind: 'buildingWorkFinished'
      readonly building: BuildingKind
      readonly level: number
    })
  | (Occurred & {
      readonly kind: 'buildingWorkStopped'
      readonly building: BuildingKind
      readonly level: number
      readonly refund: Stocks
    })
  | (Occurred & { readonly kind: 'lessonStudied'; readonly lessonId: LessonId })
  | (Occurred & { readonly kind: 'lessonStopped'; readonly lessonId: LessonId })
  | (Occurred & {
      readonly kind: 'skillEarned'
      readonly lessonId: LessonId
      readonly resource: ResourceKind
      readonly ratePercent: number
    })
  | (Occurred & {
      readonly kind: 'hiringDelivered'
      readonly hire: HireKind
      readonly count: number
    })
  | (Occurred & {
      readonly kind: 'hiringStopped'
      readonly hire: HireKind
      readonly delivered: number
      readonly stopped: number
      readonly refund: Stocks
    })
  | (Occurred & { readonly kind: 'jobBack'; readonly site: SiteAddress; readonly pay: Stocks })
  | (Occurred & {
      readonly kind: 'jobCalledBack'
      readonly site: SiteAddress
      readonly pay: Stocks
    })
  | (Occurred & {
      readonly kind: 'cleanUpDone'
      readonly site: SiteAddress
      readonly reward: Stocks
    })
  | (Occurred & { readonly kind: 'cleanUpFailed'; readonly site: SiteAddress })
  | (Occurred & { readonly kind: 'becameCity' })

export type TownEventKind = TownEvent['kind']

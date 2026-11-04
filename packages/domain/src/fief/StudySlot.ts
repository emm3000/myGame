import type { LessonId } from '../learning/Lesson'
import type { ArtKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'

export type StudySlot =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'busy'
      readonly art: ArtKind
      readonly targetLevel: number
      readonly startedAt: Instant
      readonly finishesAt: Instant
      readonly cost: Stocks
    }
  | {
      readonly kind: 'lesson'
      readonly lessonId: LessonId
      readonly startedAt: Instant
      readonly finishesAt: Instant
    }

export type BusyStudySlot = Extract<StudySlot, { readonly kind: 'busy' }>

export type LessonStudySlot = Extract<StudySlot, { readonly kind: 'lesson' }>

export type StudyTarget = Pick<BusyStudySlot, 'art' | 'targetLevel'>

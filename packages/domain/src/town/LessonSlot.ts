import type { LessonId } from '../learning/Lesson'
import type { Instant } from '../time/Instant'

export type BusyLessonSlot = {
  readonly kind: 'busy'
  readonly lessonId: LessonId
  readonly startedAt: Instant
  readonly finishesAt: Instant
}

export type LessonSlot = { readonly kind: 'idle' } | BusyLessonSlot

export const idleLessonSlot: LessonSlot = { kind: 'idle' }

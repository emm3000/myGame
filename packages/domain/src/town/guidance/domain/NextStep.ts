import type { DueHoldoutCheck } from '#holdout/domain/DueHoldoutCheck'
import type { Band } from '#learning/curriculum/domain/Band'
import type { LessonId } from '#learning/domain/Lesson'
import type { Text } from '#learning/frames/domain/Text'

export type NextStep =
  | {
      readonly kind: 'reviews'
      readonly count: number
      readonly readFirst: ReadonlyArray<LessonId>
    }
  | ({ readonly kind: 'holdoutCheck' } & DueHoldoutCheck)
  | { readonly kind: 'lessonRunning'; readonly text: NextStepText | null }
  | {
      readonly kind: 'releasedLesson'
      readonly lessonId: LessonId
      readonly band: Band
      readonly position: number
    }
  | { readonly kind: 'lessonToStudy'; readonly lessonId: LessonId }
  | {
      readonly kind: 'caughtUp'
      readonly reason: CaughtUpReason
      readonly text: NextStepText | null
    }

export type NextStepText = Pick<Text, 'id' | 'title'>

export type CaughtUpReason = 'learningCap' | 'schoolTooLow' | 'lessonsDone'

import type { DueHoldoutCheck } from '#holdout/DueHoldoutCheck'
import type { Band } from '#learning/curriculum/Band'
import type { Text } from '#learning/frames/Text'
import type { LessonId } from '#learning/Lesson'

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

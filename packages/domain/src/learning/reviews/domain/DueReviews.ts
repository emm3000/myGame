import type { Instant } from '#time/Instant'
import type { LessonId, WordId } from '../../domain/Lesson'
import type { ReviewPrompt } from './reviewPromptOf'

export type PromptedReview = {
  readonly wordId: WordId
  readonly lessonId: LessonId
  readonly dueAt: Instant
  readonly prompt: ReviewPrompt
}

export type DueReviews = {
  readonly due: ReadonlyArray<PromptedReview>
  readonly readFirst: ReadonlyArray<LessonId>
  readonly nextDueAt: Instant | null
  readonly readAt: Instant
}

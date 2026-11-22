import type { LessonId } from '../../domain/Lesson'

export type TextId = string

export type Text = {
  readonly id: TextId
  readonly fromLessonId: LessonId
  readonly title: string
  readonly sentences: ReadonlyArray<string>
}

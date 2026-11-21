import type { LessonId } from '../Lesson'

export type TextId = string

export type Text = {
  readonly id: TextId
  readonly fromLessonId: LessonId
  readonly title: string
  readonly sentences: ReadonlyArray<string>
}

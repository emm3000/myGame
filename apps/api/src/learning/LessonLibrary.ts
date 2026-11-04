import type { Lesson, LessonCatalog } from '@mygame/domain'

export type ShelvedLesson = Lesson & {
  readonly theme: string
}

export type LessonLibrary = LessonCatalog & {
  lessons(): ReadonlyArray<ShelvedLesson>
}

import type { BandCatalog, Lesson, LessonCatalog } from '@mygame/domain'

export type ShelvedLesson = Lesson & {
  readonly theme: string
}

export type LessonLibrary = LessonCatalog &
  BandCatalog & {
    lessons(): ReadonlyArray<ShelvedLesson>
  }

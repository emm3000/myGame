import type { BandCatalog, Lesson, LessonCatalog, PlacementWordCatalog } from '@mygame/domain'

export type ShelvedLesson = Lesson & {
  readonly theme: string
}

export type LessonLibrary = LessonCatalog &
  BandCatalog &
  PlacementWordCatalog & {
    lessons(): ReadonlyArray<ShelvedLesson>
  }

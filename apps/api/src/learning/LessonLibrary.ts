import type {
  BandCatalog,
  FrameCatalog,
  Lesson,
  LessonCatalog,
  PlacementWordCatalog,
} from '@mygame/domain'

export type ShelvedLesson = Lesson & {
  readonly theme: string
}

export type LessonLibrary = LessonCatalog &
  BandCatalog &
  PlacementWordCatalog &
  FrameCatalog & {
    lessons(): ReadonlyArray<ShelvedLesson>
    chromeLessons(): ReadonlyArray<ShelvedLesson>
  }

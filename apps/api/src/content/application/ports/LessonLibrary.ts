import type {
  BandCatalog,
  FrameCatalog,
  Lesson,
  LessonCatalog,
  PlacementWordCatalog,
  TextCatalog,
} from '@mygame/domain'

export type ShelvedLesson = Lesson & {
  readonly theme: string
}

export type LessonLibrary = LessonCatalog &
  BandCatalog &
  PlacementWordCatalog &
  FrameCatalog &
  TextCatalog & {
    lessons(): ReadonlyArray<ShelvedLesson>
    chromeLessons(): ReadonlyArray<ShelvedLesson>
  }

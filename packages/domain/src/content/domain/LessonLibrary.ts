import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import type { FrameCatalog } from '#learning/frames/ports/FrameCatalog'
import type { TextCatalog } from '#learning/frames/ports/TextCatalog'
import type { Lesson } from '#learning/Lesson'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'

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

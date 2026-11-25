import type { BandCatalog } from '#learning/curriculum/domain/BandCatalog'
import type { LessonCatalog } from '#learning/curriculum/domain/LessonCatalog'
import type { Lesson } from '#learning/domain/Lesson'
import type { FrameCatalog } from '#learning/frames/domain/FrameCatalog'
import type { KeepGoingTerms } from '#learning/frames/domain/KeepGoingTerms'
import type { TextCatalog } from '#learning/frames/domain/TextCatalog'
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
    keepGoingTerms(): KeepGoingTerms
  }

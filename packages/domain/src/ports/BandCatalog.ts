import type { Band, BandWord } from '../learning/BandStart'
import type { LessonId } from '../learning/Lesson'

export interface BandCatalog {
  bandOfLesson(lessonId: LessonId): Band | undefined
  wordsOfBand(band: Band): ReadonlyArray<BandWord>
}

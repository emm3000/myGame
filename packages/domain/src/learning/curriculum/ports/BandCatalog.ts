import type { LessonId } from '../../Lesson'
import type { Band, BandWord } from '../BandStart'

export interface BandCatalog {
  bandOfLesson(lessonId: LessonId): Band | undefined
  wordsOfBand(band: Band): ReadonlyArray<BandWord>
  hasLessons(band: Band): boolean
}

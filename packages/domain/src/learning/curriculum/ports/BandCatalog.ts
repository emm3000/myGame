import type { LessonId } from '../../Lesson'
import type { Band } from '../Band'
import type { BandWord } from '../BandWord'

export interface BandCatalog {
  bandOfLesson(lessonId: LessonId): Band | undefined
  wordsOfBand(band: Band): ReadonlyArray<BandWord>
  hasLessons(band: Band): boolean
}

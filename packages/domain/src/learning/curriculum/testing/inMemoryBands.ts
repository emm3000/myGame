import type { LessonId } from '../../domain/Lesson'
import type { Band } from '../domain/Band'
import type { BandCatalog } from '../domain/BandCatalog'
import type { BandWord } from '../domain/BandWord'

export type BandShelf = {
  readonly band: Band
  readonly lessonIds: ReadonlyArray<LessonId>
  readonly words: ReadonlyArray<BandWord>
}

export const inMemoryBands = (shelves: ReadonlyArray<BandShelf>): BandCatalog => ({
  bandOfLesson: (lessonId) => shelves.find(({ lessonIds }) => lessonIds.includes(lessonId))?.band,
  wordsOfBand: (band) => shelves.find((shelf) => shelf.band === band)?.words ?? [],
  hasLessons: (band) => shelves.some((shelf) => shelf.band === band && shelf.lessonIds.length > 0),
})

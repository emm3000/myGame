import type { Band, BandWord } from '../learning/BandStart'
import type { LessonId } from '../learning/Lesson'
import type { BandCatalog } from '../ports/BandCatalog'

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

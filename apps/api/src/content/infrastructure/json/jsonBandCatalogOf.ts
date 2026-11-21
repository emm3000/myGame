import type { BandCatalog } from '@mygame/domain'
import type { LessonShelf } from './LessonShelf'

export const jsonBandCatalogOf = ({ lessonBands, bandWords }: LessonShelf): BandCatalog => ({
  bandOfLesson: (lessonId) => lessonBands.get(lessonId),
  wordsOfBand: (band) => bandWords.get(band) ?? [],
  hasLessons: (band) => [...lessonBands.values()].includes(band),
})

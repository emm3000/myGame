import type { BandWord } from '#learning/curriculum/domain/BandWord'
import type { Headword } from '#learning/curriculum/domain/Headword'

export const drawableHeadwordsOf = (words: ReadonlyArray<BandWord>): ReadonlyArray<Headword> =>
  words.filter(({ isChrome }) => !isChrome).map(({ headword }) => headword)

import type { BandWord } from '#learning/curriculum/BandWord'
import type { Headword } from '#learning/curriculum/Headword'

export const drawableHeadwordsOf = (words: ReadonlyArray<BandWord>): ReadonlyArray<Headword> =>
  words.filter(({ isChrome }) => !isChrome).map(({ headword }) => headword)

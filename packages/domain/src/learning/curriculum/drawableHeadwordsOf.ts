import type { BandWord } from './BandWord'
import type { Headword } from './Headword'

export const drawableHeadwordsOf = (words: ReadonlyArray<BandWord>): ReadonlyArray<Headword> =>
  words.filter(({ isChrome }) => !isChrome).map(({ headword }) => headword)

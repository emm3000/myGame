import type { BandWord, Headword } from './BandStart'

export const drawableHeadwordsOf = (words: ReadonlyArray<BandWord>): ReadonlyArray<Headword> =>
  words.filter(({ isChrome }) => !isChrome).map(({ headword }) => headword)

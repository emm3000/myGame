import type { BandWord } from '#learning/curriculum/domain/BandWord'
import { drawableHeadwordsOf } from './drawableHeadwordsOf'

const HELD_OUT_DIVISOR = 10

export const heldOutCountOf = (words: ReadonlyArray<BandWord>): number =>
  Math.floor(drawableHeadwordsOf(words).length / HELD_OUT_DIVISOR)

import type { RandomSource } from '#ports/RandomSource'
import type { Instant } from '#time/Instant'
import type { Band } from './Band'
import type { BandStart } from './BandStart'
import type { BandWord } from './BandWord'
import { drawableHeadwordsOf } from './drawableHeadwordsOf'
import type { Headword } from './Headword'
import { heldOutCountOf } from './heldOutCountOf'

export const bandStartDrawn = (
  band: Band,
  words: ReadonlyArray<BandWord>,
  practisedWords: ReadonlyArray<Headword>,
  startedAt: Instant,
  random: RandomSource,
): BandStart => {
  const unpractised = drawableHeadwordsOf(words).filter(
    (headword) => !practisedWords.includes(headword),
  )
  return {
    band,
    startedAt,
    heldOutWords: random.sampleOf(unpractised, Math.min(heldOutCountOf(words), unpractised.length)),
    checks: [],
  }
}

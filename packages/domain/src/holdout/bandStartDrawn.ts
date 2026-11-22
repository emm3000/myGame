import type { Band } from '#learning/curriculum/Band'
import type { BandWord } from '#learning/curriculum/BandWord'
import type { Headword } from '#learning/curriculum/Headword'
import type { RandomSource } from '#platform/domain/RandomSource'
import type { Instant } from '#time/Instant'
import type { BandStart } from './BandStart'
import { drawableHeadwordsOf } from './drawableHeadwordsOf'
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

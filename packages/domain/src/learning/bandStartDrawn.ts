import type { RandomSource } from '../ports/RandomSource'
import type { Instant } from '../time/Instant'
import type { Band, BandStart, BandWord, Headword } from './BandStart'
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
    heldOutWords: random.sampleOf(unpractised, heldOutCountOf(words)),
    checks: [],
  }
}

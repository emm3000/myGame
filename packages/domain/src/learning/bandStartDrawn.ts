import type { RandomSource } from '../ports/RandomSource'
import type { Instant } from '../time/Instant'
import type { Band, BandStart, BandWord, Headword } from './BandStart'

const HELD_OUT_DIVISOR = 10

export const bandStartDrawn = (
  band: Band,
  words: ReadonlyArray<BandWord>,
  practisedWords: ReadonlyArray<Headword>,
  startedAt: Instant,
  random: RandomSource,
): BandStart => {
  const drawable = words.filter(({ isChrome }) => !isChrome).map(({ headword }) => headword)
  const heldOutCount = Math.floor(drawable.length / HELD_OUT_DIVISOR)
  const unpractised = drawable.filter((headword) => !practisedWords.includes(headword))
  return { band, startedAt, heldOutWords: random.sampleOf(unpractised, heldOutCount), checks: [] }
}

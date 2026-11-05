import type { RandomSource } from '../ports/RandomSource'
import type { Instant } from '../time/Instant'
import type { Band, BandStart, BandWord } from './BandStart'

const HELD_OUT_DIVISOR = 10

export const bandStartDrawn = (
  band: Band,
  words: ReadonlyArray<BandWord>,
  startedAt: Instant,
  random: RandomSource,
): BandStart => {
  const drawable = words.filter(({ isChrome }) => !isChrome).map(({ headword }) => headword)
  const heldOutCount = Math.floor(drawable.length / HELD_OUT_DIVISOR)
  return { band, startedAt, heldOutWords: random.sampleOf(drawable, heldOutCount) }
}

import { releasedAtOf } from '../holdout/releasedAtOf'
import type { Instant } from '../time/Instant'
import type { BandStart, Headword } from './BandStart'

export const isHeldOutAt = (start: BandStart, at: Instant): boolean => {
  const releasedAt = releasedAtOf(start)
  return releasedAt === undefined || at.epochMilliseconds < releasedAt.epochMilliseconds
}

export const heldOutWordsAt = (
  starts: ReadonlyArray<BandStart>,
  at: Instant,
): ReadonlyArray<Headword> =>
  starts.filter((start) => isHeldOutAt(start, at)).flatMap(({ heldOutWords }) => heldOutWords)

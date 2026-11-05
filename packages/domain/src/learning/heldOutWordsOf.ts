import type { BandStart, Headword } from './BandStart'

export const heldOutWordsOf = (starts: ReadonlyArray<BandStart>): ReadonlyArray<Headword> =>
  starts.flatMap(({ heldOutWords }) => heldOutWords)

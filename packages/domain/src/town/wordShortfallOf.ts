import type { HeldCard } from '../learning/HeldCard'
import { retainedWordCountOf } from '../learning/retainedWordCountOf'
import { stableWordCountOf } from '../learning/stableWordCountOf'
import { levelWordNeedOf } from './levelWordNeedOf'
import type { NeededWordKind } from './NeededWordKind'
import type { WordNeed } from './WordNeed'

export type WordShortfall = {
  readonly needed: number
  readonly held: number
  readonly standing: NeededWordKind
}

export const wordShortfallOf = (
  level: number,
  cards: ReadonlyArray<HeldCard>,
  wordNeed: WordNeed,
): WordShortfall | null => {
  const need = levelWordNeedOf(level, wordNeed)
  if (need === null) {
    return null
  }
  const held = need.standing === 'stable' ? stableWordCountOf(cards) : retainedWordCountOf(cards)
  return held < need.count ? { needed: need.count, held, standing: need.standing } : null
}

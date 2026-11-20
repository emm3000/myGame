import type { HeldCard } from './HeldCard'
import type { WordId } from './Lesson'

export type HeldCards = ReadonlyMap<WordId, HeldCard>

export const heldCardsOf = (cards: ReadonlyArray<HeldCard>): HeldCards =>
  new Map(cards.map((held) => [held.wordId, held]))

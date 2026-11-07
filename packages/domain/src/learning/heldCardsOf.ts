import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

export const heldCardsOf = (
  lesson: Lesson,
  cards: ReadonlyArray<HeldCard>,
): ReadonlyArray<HeldCard> =>
  cards.filter(({ wordId }) => lesson.words.some(({ id }) => id === wordId))

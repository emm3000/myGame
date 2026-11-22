import type { HeldCard } from '../../domain/HeldCard'
import type { Lesson } from '../../domain/Lesson'

export const heldCardsOf = (
  lesson: Lesson,
  cards: ReadonlyArray<HeldCard>,
): ReadonlyArray<HeldCard> =>
  cards.filter(({ wordId }) => lesson.words.some(({ id }) => id === wordId))

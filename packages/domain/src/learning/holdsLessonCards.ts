import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

export const holdsLessonCards = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean =>
  cards.some(({ wordId }) => lesson.words.some(({ id }) => id === wordId))

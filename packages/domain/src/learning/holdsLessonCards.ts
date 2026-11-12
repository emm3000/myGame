import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

export const holdsLessonCards = (
  lesson: Pick<Lesson, 'words'>,
  cards: ReadonlyArray<HeldCard>,
): boolean => cards.some(({ wordId }) => lesson.words.some(({ id }) => id === wordId))

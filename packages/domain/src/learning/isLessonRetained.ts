import type { HeldCard } from './HeldCard'
import { isWordRetained } from './isWordRetained'
import type { Lesson } from './Lesson'

export const isLessonRetained = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean => {
  const held = cards.filter(({ wordId }) => lesson.words.some(({ id }) => id === wordId))
  return held.length > 0 && held.every(isWordRetained)
}

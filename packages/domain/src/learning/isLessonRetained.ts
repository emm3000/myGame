import type { HeldCard } from './HeldCard'
import { isWordRetained } from './isWordRetained'
import type { Lesson } from './Lesson'

export const isLessonRetained = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean =>
  lesson.words.every(({ id }) => {
    const held = cards.find(({ wordId }) => wordId === id)
    return held !== undefined && isWordRetained(held)
  })

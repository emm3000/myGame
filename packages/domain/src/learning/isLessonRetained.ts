import type { HeldCard } from './HeldCard'
import { heldCardsOf } from './heldCardsOf'
import { isWordRetained } from './isWordRetained'
import type { Lesson } from './Lesson'

export const isLessonRetained = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean => {
  const held = heldCardsOf(lesson, cards)
  return held.length > 0 && held.every(isWordRetained)
}

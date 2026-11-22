import type { HeldCard } from '../../domain/HeldCard'
import type { Lesson } from '../../domain/Lesson'
import { heldCardsOf } from './heldCardsOf'
import { isWordRetained } from './isWordRetained'

export const isLessonRetained = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean => {
  const held = heldCardsOf(lesson, cards)
  return held.length > 0 && held.every(isWordRetained)
}

import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

const SKILL_STABILITY_DAYS = 7

export const isWordRetained = (held: HeldCard): boolean => {
  const { retainedAt, stability } = held.card.stored
  return retainedAt !== null && stability !== null && stability >= SKILL_STABILITY_DAYS
}

export const isLessonRetained = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean =>
  lesson.words.every(({ id }) => {
    const held = cards.find(({ wordId }) => wordId === id)
    return held !== undefined && isWordRetained(held)
  })

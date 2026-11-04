import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

const SKILL_STABILITY_DAYS = 7

const isRetained = (held: HeldCard | undefined): boolean => {
  const stored = held?.card.stored
  return (
    stored !== undefined &&
    stored.retainedAt !== null &&
    stored.stability !== null &&
    stored.stability >= SKILL_STABILITY_DAYS
  )
}

export const isLessonRetained = (lesson: Lesson, cards: ReadonlyArray<HeldCard>): boolean =>
  lesson.words.every(({ id }) => isRetained(cards.find((held) => held.wordId === id)))

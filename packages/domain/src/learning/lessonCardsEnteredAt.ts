import { MemoryCard } from '../memory/MemoryCard'
import type { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

export const lessonCardsEnteredAt = (lesson: Lesson, enteredAt: Instant): ReadonlyArray<HeldCard> =>
  lesson.words.map(({ id }) => ({ wordId: id, card: MemoryCard.entered(enteredAt) }))

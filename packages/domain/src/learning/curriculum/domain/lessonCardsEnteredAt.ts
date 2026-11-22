import { MemoryCard } from '#memory/domain/MemoryCard'
import type { Instant } from '#time/Instant'
import type { HeldCard } from '../../domain/HeldCard'
import type { Lesson } from '../../domain/Lesson'
import type { Headword } from './Headword'
import { wordsEnteringOf } from './wordsEnteringOf'

export const lessonCardsEnteredAt = (
  lesson: Pick<Lesson, 'words'>,
  heldOut: ReadonlyArray<Headword>,
  enteredAt: Instant,
): ReadonlyArray<HeldCard> =>
  wordsEnteringOf(lesson, heldOut).map(({ id }) => ({
    wordId: id,
    card: MemoryCard.entered(enteredAt),
  }))

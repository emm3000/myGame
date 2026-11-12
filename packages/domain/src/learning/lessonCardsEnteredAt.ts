import { MemoryCard } from '../memory/MemoryCard'
import type { Instant } from '../time/Instant'
import type { Headword } from './BandStart'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'
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

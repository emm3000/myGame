import type { Headword } from './BandStart'
import type { HeldCard } from './HeldCard'
import type { Lesson, LessonWord } from './Lesson'
import { wordsEnteringOf } from './wordsEnteringOf'

export const readableWordsOf = (
  lesson: Lesson,
  heldOut: ReadonlyArray<Headword>,
  cards: ReadonlyArray<HeldCard>,
  isRunning: boolean,
): ReadonlyArray<LessonWord> =>
  wordsEnteringOf(lesson, heldOut).filter(({ id }) => {
    const held = cards.find(({ wordId }) => wordId === id)
    return held === undefined ? isRunning : held.card.stored.lastReviewAt === null
  })

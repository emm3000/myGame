import type { HeldCards } from '../HeldCards'
import type { Lesson, LessonWord } from '../Lesson'
import type { Headword } from './BandStart'
import { wordsEnteringOf } from './wordsEnteringOf'

export const readableWordsOf = (
  lesson: Pick<Lesson, 'words'>,
  heldOut: ReadonlyArray<Headword>,
  cards: HeldCards,
  isRunning: boolean,
): ReadonlyArray<LessonWord> =>
  wordsEnteringOf(lesson, heldOut).filter(({ id }) => {
    const held = cards.get(id)
    return held === undefined ? isRunning : held.card.stored.lastReviewAt === null
  })

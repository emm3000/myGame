import type { HeldCards } from '../../domain/HeldCards'
import type { Lesson, LessonWord } from '../../domain/Lesson'
import type { Headword } from './Headword'
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

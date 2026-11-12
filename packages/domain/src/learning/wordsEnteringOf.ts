import type { Headword } from './BandStart'
import type { Lesson, LessonWord } from './Lesson'
import { lemmaWordsOf } from './lemmaWordsOf'

export const wordsEnteringOf = (
  lesson: Lesson,
  heldOut: ReadonlyArray<Headword>,
): ReadonlyArray<LessonWord> =>
  lesson.words.filter(
    ({ acceptedForms }) => !lemmaWordsOf(acceptedForms[0]).some((word) => heldOut.includes(word)),
  )

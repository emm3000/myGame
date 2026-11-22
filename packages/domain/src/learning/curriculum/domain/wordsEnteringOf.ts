import type { Lesson, LessonWord } from '../../domain/Lesson'
import type { Headword } from './Headword'
import { lemmaWordsOf } from './lemmaWordsOf'

export const wordsEnteringOf = (
  lesson: Pick<Lesson, 'words'>,
  heldOut: ReadonlyArray<Headword>,
): ReadonlyArray<LessonWord> =>
  lesson.words.filter(
    ({ acceptedForms }) => !lemmaWordsOf(acceptedForms[0]).some((word) => heldOut.includes(word)),
  )

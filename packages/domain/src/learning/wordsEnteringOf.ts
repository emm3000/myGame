import type { Headword } from './BandStart'
import { headwordOf } from './headwordOf'
import type { Lesson, LessonWord } from './Lesson'

export const wordsEnteringOf = (
  lesson: Lesson,
  heldOut: ReadonlyArray<Headword>,
): ReadonlyArray<LessonWord> =>
  lesson.words.filter(({ acceptedForms }) => !heldOut.includes(headwordOf(acceptedForms[0])))

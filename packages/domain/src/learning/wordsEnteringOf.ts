import type { Headword } from './BandStart'
import type { Lesson, LessonWord } from './Lesson'

export const wordsEnteringOf = (
  lesson: Lesson,
  heldOut: ReadonlyArray<Headword>,
): ReadonlyArray<LessonWord> =>
  lesson.words.filter(({ acceptedForms }) => !heldOut.includes(acceptedForms[0].toLowerCase()))

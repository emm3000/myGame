import type { LessonCatalog } from '../ports/LessonCatalog'
import type { Headword } from './BandStart'
import type { HeldCard } from './HeldCard'
import { lemmaWordsOf } from './lemmaWordsOf'

export const practisedWordsOf = (
  held: ReadonlyArray<HeldCard>,
  lessons: Pick<LessonCatalog, 'lessonOfWord'>,
): ReadonlyArray<Headword> =>
  held
    .flatMap(
      ({ wordId }) => lessons.lessonOfWord(wordId)?.words.filter(({ id }) => id === wordId) ?? [],
    )
    .flatMap(({ acceptedForms }) => lemmaWordsOf(acceptedForms[0]))

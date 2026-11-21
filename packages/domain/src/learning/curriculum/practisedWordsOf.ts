import type { HeldCard } from '../HeldCard'
import type { Headword } from './BandStart'
import { lemmaWordsOf } from './lemmaWordsOf'
import type { LessonCatalog } from './ports/LessonCatalog'

export const practisedWordsOf = (
  held: ReadonlyArray<HeldCard>,
  lessons: Pick<LessonCatalog, 'lessonOfWord'>,
): ReadonlyArray<Headword> =>
  held
    .flatMap(
      ({ wordId }) => lessons.lessonOfWord(wordId)?.words.filter(({ id }) => id === wordId) ?? [],
    )
    .flatMap(({ acceptedForms }) => lemmaWordsOf(acceptedForms[0]))

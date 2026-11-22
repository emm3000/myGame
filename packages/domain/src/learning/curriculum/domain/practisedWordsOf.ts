import type { HeldCard } from '../../domain/HeldCard'
import type { Headword } from './Headword'
import type { LessonCatalog } from './LessonCatalog'
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

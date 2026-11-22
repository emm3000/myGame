import type { LessonCatalog, LessonLibrary } from '@mygame/domain'
import type { LessonShelf } from './LessonShelf'

export const jsonLessonCatalogOf = ({
  lessons,
  chromeLessons,
  headwords,
}: LessonShelf): LessonCatalog & Pick<LessonLibrary, 'lessons' | 'chromeLessons'> => ({
  lessonOf: (lessonId) => lessons.find(({ id }) => id === lessonId),
  lessonOfWord: (wordId) => lessons.find(({ words }) => words.some(({ id }) => id === wordId)),
  isHeadword: (word) => headwords.has(word.toLowerCase()),
  lessons: () => lessons,
  chromeLessons: () => chromeLessons,
})

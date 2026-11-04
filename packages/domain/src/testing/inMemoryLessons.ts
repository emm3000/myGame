import type { Lesson } from '../learning/Lesson'
import type { LessonCatalog } from '../ports/LessonCatalog'

export const inMemoryLessons = (
  lessons: ReadonlyArray<Lesson>,
  headwords: ReadonlyArray<string>,
): LessonCatalog => ({
  lessonOf: (lessonId) => lessons.find(({ id }) => id === lessonId),
  lessonOfWord: (wordId) => lessons.find(({ words }) => words.some(({ id }) => id === wordId)),
  isHeadword: (word) => headwords.includes(word),
})

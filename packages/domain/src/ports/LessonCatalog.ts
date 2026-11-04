import type { Lesson, LessonId, WordId } from '../learning/Lesson'

export interface LessonCatalog {
  lessonOf(lessonId: LessonId): Lesson | undefined
  lessonOfWord(wordId: WordId): Lesson | undefined
  isHeadword(word: string): boolean
}

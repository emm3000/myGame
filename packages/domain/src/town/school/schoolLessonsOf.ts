import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import type { LessonId } from '#learning/Lesson'
import type { SchoolLesson } from './SchoolLesson'

export type SchoolLessons = {
  lessonOf(lessonId: LessonId): SchoolLesson | undefined
}

export const schoolLessonsOf = (
  catalog: Pick<LessonCatalog, 'lessonOf'>,
  released: ReadonlyArray<SchoolLesson>,
): SchoolLessons => ({
  lessonOf: (lessonId) => catalog.lessonOf(lessonId) ?? released.find(({ id }) => id === lessonId),
})

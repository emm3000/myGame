import type { LessonId, SchoolLesson } from '../learning/Lesson'
import type { LessonCatalog } from '../ports/LessonCatalog'

export type SchoolLessons = {
  lessonOf(lessonId: LessonId): SchoolLesson | undefined
}

export const schoolLessonsOf = (
  catalog: Pick<LessonCatalog, 'lessonOf'>,
  released: ReadonlyArray<SchoolLesson>,
): SchoolLessons => ({
  lessonOf: (lessonId) => catalog.lessonOf(lessonId) ?? released.find(({ id }) => id === lessonId),
})

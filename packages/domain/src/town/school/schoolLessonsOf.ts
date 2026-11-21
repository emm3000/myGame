import type { LessonCatalog } from '../../learning/curriculum/ports/LessonCatalog'
import type { LessonId, SchoolLesson } from '../../learning/Lesson'

export type SchoolLessons = {
  lessonOf(lessonId: LessonId): SchoolLesson | undefined
}

export const schoolLessonsOf = (
  catalog: Pick<LessonCatalog, 'lessonOf'>,
  released: ReadonlyArray<SchoolLesson>,
): SchoolLessons => ({
  lessonOf: (lessonId) => catalog.lessonOf(lessonId) ?? released.find(({ id }) => id === lessonId),
})

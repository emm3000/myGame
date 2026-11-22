import type { Lesson } from '#learning/domain/Lesson'
import type { LessonSlot } from './LessonSlot'

export const isLessonUnderStudy = (lesson: Pick<Lesson, 'id'>, slot: LessonSlot): boolean =>
  slot.kind === 'busy' && slot.lessonId === lesson.id

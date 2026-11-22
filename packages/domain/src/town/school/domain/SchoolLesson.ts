import type { Lesson } from '#learning/domain/Lesson'

export type SchoolLesson = Omit<Lesson, 'skill'>

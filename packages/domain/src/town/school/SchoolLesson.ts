import type { Lesson } from '../../learning/Lesson'

export type SchoolLesson = Omit<Lesson, 'skill'>

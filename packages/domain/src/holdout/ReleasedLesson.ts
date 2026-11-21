import type { Band } from '../learning/curriculum/BandStart'
import type { SchoolLesson } from '../learning/Lesson'

export type ReleasedLesson = SchoolLesson & {
  readonly band: Band
  readonly position: number
}

import type { Band } from '#learning/curriculum/BandStart'
import type { SchoolLesson } from '#town/school/SchoolLesson'

export type ReleasedLesson = SchoolLesson & {
  readonly band: Band
  readonly position: number
}

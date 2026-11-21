import type { Band } from '#learning/curriculum/Band'
import type { SchoolLesson } from '#town/school/SchoolLesson'

export type ReleasedLesson = SchoolLesson & {
  readonly band: Band
  readonly position: number
}

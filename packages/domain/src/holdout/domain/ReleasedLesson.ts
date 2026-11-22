import type { Band } from '#learning/curriculum/Band'
import type { SchoolLesson } from '#town/school/domain/SchoolLesson'

export type ReleasedLesson = SchoolLesson & {
  readonly band: Band
  readonly position: number
}

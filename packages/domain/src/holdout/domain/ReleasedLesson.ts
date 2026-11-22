import type { Band } from '#learning/curriculum/domain/Band'
import type { SchoolLesson } from '#town/school/domain/SchoolLesson'

export type ReleasedLesson = SchoolLesson & {
  readonly band: Band
  readonly position: number
}

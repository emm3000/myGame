import { isUnitLemma } from './isUnitLemma'
import type { Lesson } from './Lesson'

export const isUnitLesson = ({ words }: Lesson): boolean =>
  words.every(({ acceptedForms }) => isUnitLemma(acceptedForms[0]))

import type { Lesson } from '../Lesson'
import { isUnitLemma } from './isUnitLemma'

export const isUnitLesson = ({ words }: Lesson): boolean =>
  words.every(({ acceptedForms }) => isUnitLemma(acceptedForms[0]))

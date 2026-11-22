import type { Lesson } from '../../domain/Lesson'
import { isUnitLemma } from './isUnitLemma'

export const isUnitLesson = ({ words }: Lesson): boolean =>
  words.every(({ acceptedForms }) => isUnitLemma(acceptedForms[0]))

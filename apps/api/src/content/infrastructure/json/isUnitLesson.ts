import { isUnit } from './isUnit'
import type { LessonOfFiles } from './readLessonContentFiles'

export const isUnitLesson = ({ words }: LessonOfFiles): boolean => words.every(isUnit)

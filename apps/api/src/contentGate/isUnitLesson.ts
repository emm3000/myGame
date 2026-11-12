import type { LessonOfFiles } from '../adapters/json/lessonContentFilesOf'
import { isUnit } from './isUnit'

export const isUnitLesson = ({ words }: LessonOfFiles): boolean => words.every(isUnit)

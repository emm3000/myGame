import type { CurriculumContent } from '@mygame/contracts'

export const lessonPositionOf = ({ lessonIds }: CurriculumContent, lessonId: string): number =>
  lessonIds.indexOf(lessonId) + 1

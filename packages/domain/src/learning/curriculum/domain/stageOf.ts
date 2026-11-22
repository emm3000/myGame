import type { HeldCard } from '../../domain/HeldCard'
import { holdsLessonCards } from '../../domain/holdsLessonCards'
import type { Lesson, LessonId } from '../../domain/Lesson'
import type { Band } from './Band'
import type { BandCatalog } from './BandCatalog'
import { isLessonPlacedOut } from './isLessonPlacedOut'
import { isUnitLesson } from './isUnitLesson'

export type Stage = ReadonlyArray<LessonId>

export const stageOf = (
  curriculum: ReadonlyArray<Lesson>,
  cards: ReadonlyArray<HeldCard>,
  placedOutBands: ReadonlyArray<Band>,
  bands: Pick<BandCatalog, 'bandOfLesson'>,
): Stage => {
  const staged = curriculum.filter((lesson) => !isUnitLesson(lesson))
  const firstUnreached = staged.findIndex(
    (lesson) =>
      !holdsLessonCards(lesson, cards) && !isLessonPlacedOut(lesson, placedOutBands, bands),
  )
  const reached = firstUnreached === -1 ? staged : staged.slice(0, firstUnreached)
  return reached.map(({ id }) => id)
}

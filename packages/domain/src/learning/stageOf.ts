import type { BandCatalog } from '../ports/BandCatalog'
import type { Band } from './BandStart'
import type { HeldCard } from './HeldCard'
import { holdsLessonCards } from './holdsLessonCards'
import { isLessonPlacedOut } from './isLessonPlacedOut'
import { isUnitLesson } from './isUnitLesson'
import type { Lesson, LessonId } from './Lesson'

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

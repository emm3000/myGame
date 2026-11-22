import type { Lesson, LessonId } from '../../domain/Lesson'
import type { DueCard } from './dueCardsAt'

export const readFirstOf = (
  curriculum: ReadonlyArray<Lesson>,
  due: ReadonlyArray<DueCard>,
): ReadonlyArray<LessonId> => {
  const unreviewed = new Set(
    due.filter(({ card }) => card.stored.lastReviewAt === null).map(({ wordId }) => wordId),
  )
  return curriculum
    .filter(({ words }) => words.some(({ id }) => unreviewed.has(id)))
    .map(({ id }) => id)
}

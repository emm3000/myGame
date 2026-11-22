import type { BandStart } from '#holdout/domain/BandStart'
import { heldOutWordsAt } from '#holdout/domain/heldOutWordsAt'
import { lessonCardsEnteredAt } from '#learning/curriculum/lessonCardsEnteredAt'
import type { HeldCard } from '#learning/HeldCard'
import { holdsLessonCards } from '#learning/holdsLessonCards'
import type { Instant } from '#time/Instant'
import type { TownEvent } from '../../domain/TownEvent'
import { isLessonFinishedBy } from './isLessonFinishedBy'
import { idleLessonSlot, type LessonSlot } from './LessonSlot'
import type { SchoolLessons } from './schoolLessonsOf'

export type SettledLessonSlot = {
  readonly slot: LessonSlot
  readonly entered: ReadonlyArray<HeldCard>
  readonly events: ReadonlyArray<TownEvent>
}

export const settledLessonSlot = (
  slot: LessonSlot,
  held: ReadonlyArray<HeldCard>,
  starts: ReadonlyArray<BandStart>,
  lessons: SchoolLessons,
  now: Instant,
): SettledLessonSlot => {
  if (slot.kind === 'idle' || !isLessonFinishedBy(slot, now)) {
    return { slot, entered: [], events: [] }
  }
  const lesson = lessons.lessonOf(slot.lessonId)
  if (lesson === undefined) {
    return { slot: idleLessonSlot, entered: [], events: [] }
  }
  const { finishesAt } = slot
  return {
    slot: idleLessonSlot,
    entered: holdsLessonCards(lesson, held)
      ? []
      : lessonCardsEnteredAt(lesson, heldOutWordsAt(starts, finishesAt), finishesAt),
    events: [{ kind: 'lessonStudied', lessonId: lesson.id, occurredAt: finishesAt }],
  }
}

import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import { lessonCardsEnteredAt } from '../learning/lessonCardsEnteredAt'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { Instant } from '../time/Instant'
import { idleLessonSlot, type LessonSlot } from './LessonSlot'
import type { TownEvent } from './TownEvent'

export type SettledLessonSlot = {
  readonly slot: LessonSlot
  readonly entered: ReadonlyArray<HeldCard>
  readonly events: ReadonlyArray<TownEvent>
}

export const settledLessonSlot = (
  slot: LessonSlot,
  held: ReadonlyArray<HeldCard>,
  lessons: Pick<LessonCatalog, 'lessonOf'>,
  now: Instant,
): SettledLessonSlot => {
  if (slot.kind === 'idle' || slot.finishesAt.epochMilliseconds > now.epochMilliseconds) {
    return { slot, entered: [], events: [] }
  }
  const lesson = lessons.lessonOf(slot.lessonId)
  if (lesson === undefined) {
    return { slot: idleLessonSlot, entered: [], events: [] }
  }
  const { finishesAt } = slot
  return {
    slot: idleLessonSlot,
    entered: holdsLessonCards(lesson, held) ? [] : lessonCardsEnteredAt(lesson, finishesAt),
    events: [{ kind: 'lessonStudied', lessonId: lesson.id, occurredAt: finishesAt }],
  }
}

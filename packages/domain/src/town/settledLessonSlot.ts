import type { DomainError } from '../DomainError'
import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import { lessonCardsEnteredAt } from '../learning/lessonCardsEnteredAt'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { err, ok, type Result } from '../Result'
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
): Result<SettledLessonSlot, DomainError> => {
  if (slot.kind === 'idle' || slot.finishesAt.epochMilliseconds > now.epochMilliseconds) {
    return ok({ slot, entered: [], events: [] })
  }
  const lesson = lessons.lessonOf(slot.lessonId)
  if (lesson === undefined) {
    return err({ kind: 'LessonNotFound', lessonId: slot.lessonId })
  }
  const { finishesAt } = slot
  return ok({
    slot: idleLessonSlot,
    entered: holdsLessonCards(lesson, held) ? [] : lessonCardsEnteredAt(lesson, finishesAt),
    events: [{ kind: 'lessonStudied', lessonId: lesson.id, occurredAt: finishesAt }],
  })
}

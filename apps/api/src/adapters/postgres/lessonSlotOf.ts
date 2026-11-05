import { Instant } from '@mygame/domain'
import { idleLessonSlot, type LessonSlot } from '@mygame/domain/town'
import type { townLessonSlots } from './schema'

export const lessonSlotOf = (row: typeof townLessonSlots.$inferSelect | null): LessonSlot =>
  row === null
    ? idleLessonSlot
    : {
        kind: 'busy',
        lessonId: row.lessonId,
        startedAt: Instant.fromEpochMilliseconds(row.startedAt.getTime()),
        finishesAt: Instant.fromEpochMilliseconds(row.finishesAt.getTime()),
      }

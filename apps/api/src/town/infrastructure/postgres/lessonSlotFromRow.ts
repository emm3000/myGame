import { Instant, idleLessonSlot, type LessonSlot } from '@mygame/domain'
import type { townLessonSlots } from './schoolTables'

export const lessonSlotFromRow = (row: typeof townLessonSlots.$inferSelect | null): LessonSlot =>
  row === null
    ? idleLessonSlot
    : {
        kind: 'busy',
        lessonId: row.lessonId,
        startedAt: Instant.fromEpochMilliseconds(row.startedAt.getTime()),
        finishesAt: Instant.fromEpochMilliseconds(row.finishesAt.getTime()),
      }

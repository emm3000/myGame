import { describe, expect, it } from 'vitest'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import type { LessonSlot } from './LessonSlot'
import { settledLessonSlot } from './settledLessonSlot'

const startedAt = Instant.fromEpochMilliseconds(1_791_162_000_000)

const finishesAt = Instant.fromEpochMilliseconds(1_791_162_300_000)

const afterFinish = Instant.fromEpochMilliseconds(1_791_165_600_000)

const finishedSlotOf = (lessonId: string): LessonSlot => ({
  kind: 'busy',
  lessonId,
  startedAt,
  finishesAt,
})

describe('settledLessonSlot', () => {
  it('settles a finished lesson gone from the catalog as an empty slot', () => {
    const settled = settledLessonSlot(
      finishedSlotOf('lesson-gone'),
      [],
      inMemoryLessons([lessonOne], []),
      afterFinish,
    )

    expect(settled).toEqual({ slot: { kind: 'idle' }, entered: [], events: [] })
  })
})

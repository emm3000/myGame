import { type FiefEvent, Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { fiefChronicleOf } from './fiefChronicleOf'

const learnedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const cancelledAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:58:00Z'))

describe('fiefChronicleOf', () => {
  it('names the lesson a learned and a cancelled lesson event carry', () => {
    const events: ReadonlyArray<FiefEvent> = [
      { kind: 'lessonLearned', lessonId: 'lesson-1', occurredAt: learnedAt },
      { kind: 'lessonCancelled', lessonId: 'lesson-1', occurredAt: cancelledAt },
    ]

    expect(fiefChronicleOf(events)).toEqual({
      events: [
        { kind: 'lessonLearned', lessonId: 'lesson-1', occurredAt: '2026-11-10T09:00:00.000Z' },
        { kind: 'lessonCancelled', lessonId: 'lesson-1', occurredAt: '2026-11-10T08:58:00.000Z' },
      ],
    })
  })
})

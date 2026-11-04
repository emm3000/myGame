import { err, type FiefEvent, Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { fiefChronicleOf } from './fiefChronicleOf'

const learnedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const libraryFinished: FiefEvent = {
  kind: 'upgradeFinished',
  building: 'library',
  level: 1,
  occurredAt: learnedAt,
}

describe('fiefChronicleOf', () => {
  it('refuses a lesson event until the wire names the lesson kinds', () => {
    const chronicle = fiefChronicleOf([
      libraryFinished,
      { kind: 'lessonLearned', lessonId: 'lesson-1', occurredAt: learnedAt },
    ])

    expect(chronicle).toEqual(err({ kind: 'LessonNotStored', lessonId: 'lesson-1' }))
  })
})

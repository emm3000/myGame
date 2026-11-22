import { describe, expect, it } from 'vitest'
import { Instant } from '#time/Instant'
import { isLessonUnderStudy } from './isLessonUnderStudy'
import { idleLessonSlot, type LessonSlot } from './LessonSlot'

const slotStudying = (lessonId: string): LessonSlot => ({
  kind: 'busy',
  lessonId,
  startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-12T08:00:00Z')),
  finishesAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z')),
})

describe('isLessonUnderStudy', () => {
  it('counts a lesson as under study while the slot studies it', () => {
    expect(isLessonUnderStudy({ id: 'lesson-1' }, slotStudying('lesson-1'))).toBe(true)
  })

  it('counts a lesson as not under study while the slot studies another one', () => {
    expect(isLessonUnderStudy({ id: 'lesson-1' }, slotStudying('lesson-2'))).toBe(false)
  })

  it('counts no lesson as under study while the slot is idle', () => {
    expect(isLessonUnderStudy({ id: 'lesson-1' }, idleLessonSlot)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { CancelLessonRequestSchema } from './index'

describe('CancelLessonRequestSchema', () => {
  it('parses the lesson the path names beside the fief id', () => {
    expect(
      CancelLessonRequestSchema.parse({ fiefId: 'a fief id', lessonId: 'lesson-1' }).lessonId,
    ).toBe('lesson-1')
  })

  it('rejects an empty lesson id', () => {
    expect(CancelLessonRequestSchema.safeParse({ lessonId: '' }).success).toBe(false)
  })
})

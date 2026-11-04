import { describe, expect, it } from 'vitest'
import { StartLessonRequestSchema } from './index'

describe('StartLessonRequestSchema', () => {
  it('parses the lesson to study', () => {
    expect(StartLessonRequestSchema.parse({ lessonId: 'lesson-1' })).toEqual({
      lessonId: 'lesson-1',
    })
  })

  it('rejects an empty lesson id', () => {
    expect(StartLessonRequestSchema.safeParse({ lessonId: '' }).success).toBe(false)
  })

  it('rejects a key the request does not know', () => {
    expect(
      StartLessonRequestSchema.safeParse({ lessonId: 'lesson-1', art: 'smithing' }).success,
    ).toBe(false)
  })
})

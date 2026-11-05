import { describe, expect, it } from 'vitest'
import { StopLessonRequestSchema } from './index'

describe('StopLessonRequestSchema', () => {
  it('parses the lesson the path names', () => {
    expect(StopLessonRequestSchema.parse({ lessonId: 'lesson-1' })).toEqual({
      lessonId: 'lesson-1',
    })
  })

  it('rejects an empty lesson id', () => {
    expect(StopLessonRequestSchema.safeParse({ lessonId: '' }).success).toBe(false)
  })
})

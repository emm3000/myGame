import { describe, expect, it } from 'vitest'
import { ReviewRequestSchema } from './index'

describe('ReviewRequestSchema', () => {
  it('parses the word the path names beside the fief id', () => {
    expect(ReviewRequestSchema.parse({ fiefId: 'a fief id', wordId: 'lesson-1-2' }).wordId).toBe(
      'lesson-1-2',
    )
  })

  it('rejects an empty word id', () => {
    expect(ReviewRequestSchema.safeParse({ wordId: '' }).success).toBe(false)
  })
})

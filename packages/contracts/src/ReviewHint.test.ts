import { describe, expect, it } from 'vitest'
import { ReviewHintSchema } from './index'

describe('ReviewHintSchema', () => {
  it('parses the first letter and the letter count', () => {
    expect(ReviewHintSchema.parse({ firstLetter: 's', letterCount: 6 })).toEqual({
      firstLetter: 's',
      letterCount: 6,
    })
  })

  it('rejects a hint that carries the word', () => {
    expect(
      ReviewHintSchema.safeParse({ firstLetter: 's', letterCount: 6, word: 'school' }).success,
    ).toBe(false)
  })

  it('rejects a fractional letter count', () => {
    expect(ReviewHintSchema.safeParse({ firstLetter: 's', letterCount: 5.5 }).success).toBe(false)
  })
})

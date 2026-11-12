import { describe, expect, it } from 'vitest'
import { ReviewHintSchema } from './index'

describe('ReviewHintSchema', () => {
  it('parses the first letter and the letter count of each word, in order', () => {
    const hint = {
      words: [
        { firstLetter: 'g', letterCount: 4 },
        { firstLetter: 'u', letterCount: 2 },
      ],
    }

    expect(ReviewHintSchema.parse(hint)).toEqual(hint)
  })

  it('rejects a hint with no word', () => {
    expect(ReviewHintSchema.safeParse({ words: [] }).success).toBe(false)
  })

  it('rejects a hint that carries the word', () => {
    expect(
      ReviewHintSchema.safeParse({
        words: [{ firstLetter: 's', letterCount: 6, word: 'school' }],
      }).success,
    ).toBe(false)
  })

  it('rejects the single-word shape of before', () => {
    expect(ReviewHintSchema.safeParse({ firstLetter: 's', letterCount: 6 }).success).toBe(false)
  })

  it('rejects a fractional letter count', () => {
    expect(
      ReviewHintSchema.safeParse({ words: [{ firstLetter: 's', letterCount: 5.5 }] }).success,
    ).toBe(false)
  })
})

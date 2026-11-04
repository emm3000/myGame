import { describe, expect, it } from 'vitest'
import { ReviewAnswerRequestSchema } from './index'

describe('ReviewAnswerRequestSchema', () => {
  it('parses the raw answer as typed', () => {
    expect(ReviewAnswerRequestSchema.parse({ answer: '  School ' })).toEqual({
      answer: '  School ',
    })
  })

  it('accepts an empty answer, which grades wrong', () => {
    expect(ReviewAnswerRequestSchema.parse({ answer: '' })).toEqual({ answer: '' })
  })

  it('rejects an answer above 100 characters', () => {
    expect(ReviewAnswerRequestSchema.safeParse({ answer: 'a'.repeat(101) }).success).toBe(false)
  })

  it('rejects an answer that carries its own rating', () => {
    expect(ReviewAnswerRequestSchema.safeParse({ answer: 'school', rating: 'good' }).success).toBe(
      false,
    )
  })
})

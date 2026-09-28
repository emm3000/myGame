import { describe, expect, it } from 'vitest'
import { VerifyEmailRequestSchema } from './index'

describe('VerifyEmailRequestSchema', () => {
  it('parses the token the link carried', () => {
    expect(VerifyEmailRequestSchema.parse({ token: 'c2VsbG8' })).toEqual({ token: 'c2VsbG8' })
  })

  it('rejects a verify request with an empty token', () => {
    expect(VerifyEmailRequestSchema.safeParse({ token: '' }).success).toBe(false)
  })

  it('rejects a verify request that carries more than the token', () => {
    expect(VerifyEmailRequestSchema.safeParse({ token: 'c2VsbG8', email: 'a@b.c' }).success).toBe(
      false,
    )
  })
})

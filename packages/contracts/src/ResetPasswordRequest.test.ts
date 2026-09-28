import { describe, expect, it } from 'vitest'
import { ResetPasswordRequestSchema } from './index'

describe('ResetPasswordRequestSchema', () => {
  it('parses the token the link carried and an eight-character password', () => {
    const reset = { token: 'c2VsbG8', password: 'ocho1234' }

    expect(ResetPasswordRequestSchema.parse(reset)).toEqual(reset)
  })

  it('rejects a reset without a token', () => {
    expect(ResetPasswordRequestSchema.safeParse({ password: 'ocho1234' }).success).toBe(false)
  })

  it('rejects a reset with an empty token', () => {
    expect(ResetPasswordRequestSchema.safeParse({ token: '', password: 'ocho1234' }).success).toBe(
      false,
    )
  })

  it('rejects a new password shorter than eight characters', () => {
    expect(
      ResetPasswordRequestSchema.safeParse({ token: 'c2VsbG8', password: 'siete12' }).success,
    ).toBe(false)
  })

  it('rejects a reset that carries more than the token and the password', () => {
    expect(
      ResetPasswordRequestSchema.safeParse({
        token: 'c2VsbG8',
        password: 'ocho1234',
        email: 'a@b.c',
      }).success,
    ).toBe(false)
  })
})

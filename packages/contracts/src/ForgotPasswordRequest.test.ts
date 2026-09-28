import { describe, expect, it } from 'vitest'
import { ForgotPasswordRequestSchema } from './index'

describe('ForgotPasswordRequestSchema', () => {
  it('parses the email the reset is asked for', () => {
    expect(ForgotPasswordRequestSchema.parse({ email: 'ana@example.com' })).toEqual({
      email: 'ana@example.com',
    })
  })

  it('rejects a reset request with a malformed email', () => {
    expect(ForgotPasswordRequestSchema.safeParse({ email: 'ana' }).success).toBe(false)
  })

  it('rejects a reset request that carries more than the email', () => {
    expect(
      ForgotPasswordRequestSchema.safeParse({ email: 'ana@example.com', password: 'ocho1234' })
        .success,
    ).toBe(false)
  })
})

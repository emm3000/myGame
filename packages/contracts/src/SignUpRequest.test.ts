import { describe, expect, it } from 'vitest'
import { SignUpRequestSchema } from './index'

const signUp = (password: string): unknown => ({
  email: 'aldara@example.com',
  password,
  fiefName: 'Vado Gris',
})

describe('SignUpRequestSchema', () => {
  it('parses a sign-up with an eight-character password', () => {
    expect(SignUpRequestSchema.parse(signUp('ocho1234'))).toEqual(signUp('ocho1234'))
  })

  it('rejects a password shorter than eight characters', () => {
    expect(SignUpRequestSchema.safeParse(signUp('siete12')).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { SignUpRequestSchema } from './index'

const signUp = (password: string): unknown => ({
  email: 'aldara@example.com',
  password,
})

describe('SignUpRequestSchema', () => {
  it('parses a sign-up with an eight-character password', () => {
    expect(SignUpRequestSchema.parse(signUp('ocho1234'))).toEqual(signUp('ocho1234'))
  })

  it('rejects a password shorter than eight characters', () => {
    expect(SignUpRequestSchema.safeParse(signUp('siete12')).success).toBe(false)
  })

  it('drops the fief name an older client still sends', () => {
    expect(
      SignUpRequestSchema.parse({ ...(signUp('ocho1234') as object), fiefName: 'Vado Gris' }),
    ).toEqual(signUp('ocho1234'))
  })
})

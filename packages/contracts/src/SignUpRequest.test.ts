import { describe, expect, it } from 'vitest'
import { SignUpRequestSchema } from './index'

const signUp = (password: string): unknown => ({
  email: 'aldara@example.com',
  password,
  fiefName: 'Vado Gris',
})

const signUpNaming = (fiefName: string): unknown => ({
  email: 'aldara@example.com',
  password: 'ocho1234',
  fiefName,
})

describe('SignUpRequestSchema', () => {
  it('parses a sign-up with an eight-character password', () => {
    expect(SignUpRequestSchema.parse(signUp('ocho1234'))).toEqual(signUp('ocho1234'))
  })

  it('rejects a password shorter than eight characters', () => {
    expect(SignUpRequestSchema.safeParse(signUp('siete12')).success).toBe(false)
  })

  it('rejects a fief name that is only spaces', () => {
    expect(SignUpRequestSchema.safeParse(signUpNaming('   ')).success).toBe(false)
  })

  it('trims the fief name', () => {
    expect(SignUpRequestSchema.parse(signUpNaming('  Vado Gris ')).fiefName).toBe('Vado Gris')
  })
})

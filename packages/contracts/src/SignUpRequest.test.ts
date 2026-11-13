import { describe, expect, it } from 'vitest'
import { SignUpRequestSchema } from './index'

const signUp = (password: string): unknown => ({
  email: 'aldara@example.com',
  password,
  scaffold: 'es',
})

describe('SignUpRequestSchema', () => {
  it('parses a sign-up with an eight-character password', () => {
    expect(SignUpRequestSchema.parse(signUp('ocho1234'))).toEqual(signUp('ocho1234'))
  })

  it('rejects a password shorter than eight characters', () => {
    expect(SignUpRequestSchema.safeParse(signUp('siete12')).success).toBe(false)
  })

  it('parses a sign-up that asks for no scaffold language', () => {
    const noScaffold = { ...(signUp('ocho1234') as object), scaffold: 'none' }

    expect(SignUpRequestSchema.parse(noScaffold)).toEqual(noScaffold)
  })

  it('rejects a sign-up without a scaffold', () => {
    const { scaffold: _, ...withoutScaffold } = signUp('ocho1234') as { scaffold: string }

    expect(SignUpRequestSchema.safeParse(withoutScaffold).success).toBe(false)
  })

  it('drops a field the request does not define', () => {
    expect(
      SignUpRequestSchema.parse({ ...(signUp('ocho1234') as object), townName: 'Maple Falls' }),
    ).toEqual(signUp('ocho1234'))
  })
})

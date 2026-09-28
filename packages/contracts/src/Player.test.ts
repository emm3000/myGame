import { describe, expect, it } from 'vitest'
import { PlayerSchema } from './index'

const aldara = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldara@example.com',
  emailVerified: false,
}

describe('PlayerSchema', () => {
  it('parses a player whose email is not verified', () => {
    expect(PlayerSchema.parse(aldara)).toEqual(aldara)
  })

  it('rejects a player without emailVerified', () => {
    const { emailVerified: _, ...withoutEmailVerified } = aldara

    expect(PlayerSchema.safeParse(withoutEmailVerified).success).toBe(false)
  })
})

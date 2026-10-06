import { describe, expect, it } from 'vitest'
import { PlayerSchema } from './index'

const unverifiedPlayer = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldara@example.com',
  emailVerified: false,
  seenHints: [],
}

describe('PlayerSchema', () => {
  it('parses a player whose email is not verified', () => {
    expect(PlayerSchema.parse(unverifiedPlayer)).toEqual(unverifiedPlayer)
  })

  it('rejects a player without emailVerified', () => {
    const { emailVerified: _, ...withoutEmailVerified } = unverifiedPlayer

    expect(PlayerSchema.safeParse(withoutEmailVerified).success).toBe(false)
  })

  it('parses the hints a player has seen', () => {
    const player = { ...unverifiedPlayer, seenHints: ['peasants', 'fullStore'] }

    expect(PlayerSchema.parse(player)).toEqual(player)
  })

  it('rejects a player without seenHints', () => {
    const { seenHints: _, ...withoutSeenHints } = unverifiedPlayer

    expect(PlayerSchema.safeParse(withoutSeenHints).success).toBe(false)
  })

  it('rejects a seen hint it does not know', () => {
    expect(PlayerSchema.safeParse({ ...unverifiedPlayer, seenHints: ['dragons'] }).success).toBe(
      false,
    )
  })
})

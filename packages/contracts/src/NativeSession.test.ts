import { describe, expect, it } from 'vitest'
import { NativeSessionSchema } from './index'

const signedInPlayer = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldara@example.com',
  emailVerified: true,
}

const nativeSession = {
  token: 'kX9v2bQ7rT4mN8pL1sW6yZ3cF5hJ0gD2aE7uI9oR4tY',
  player: signedInPlayer,
}

describe('NativeSessionSchema', () => {
  it('parses the session token beside the signed-in player', () => {
    expect(NativeSessionSchema.parse(nativeSession)).toEqual(nativeSession)
  })

  it('rejects a session without a token', () => {
    expect(NativeSessionSchema.safeParse({ ...nativeSession, token: '' }).success).toBe(false)
  })

  it('rejects a session without the player', () => {
    const { player: _, ...withoutPlayer } = nativeSession

    expect(NativeSessionSchema.safeParse(withoutPlayer).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { PasswordHasher } from '../domain/PasswordHasher'
import type { Sessions } from '../domain/Sessions'
import { MemoryAccountTokens } from '../testing/MemoryAccountTokens'
import { signedUpAccountsOf } from '../testing/signedUpAccountsOf'
import { SignIn } from './SignIn'

type HashCheck = {
  readonly storedHash: string | undefined
  readonly password: string
}

const recordingPasswords = (checks: Array<HashCheck>): PasswordHasher => ({
  hashOf: async (password) => `hash-of-${password}`,
  matches: async (storedHash, password) => {
    checks.push({ storedHash, password })
    return false
  },
})

const closedSessions: Sessions = {
  openSession: async () => {},
  renewSession: async () => undefined,
  closeSession: async () => {},
  closeSessionsOf: async () => {},
}

const signInWith = (passwords: PasswordHasher): SignIn =>
  new SignIn({
    unitOfWork: inMemoryUnitOfWork({
      accounts: signedUpAccountsOf(['player-1']),
      accountTokens: new MemoryAccountTokens(),
      sessions: closedSessions,
    }),
    clock: { now: () => Instant.fromEpochMilliseconds(0) },
    passwords,
    sessionTokens: { newToken: () => 'session-token' },
  })

describe('SignIn', () => {
  it('makes an unknown email still pay one hash check', async () => {
    const checks: Array<HashCheck> = []

    await signInWith(recordingPasswords(checks)).execute({
      email: 'stranger@example.com',
      password: 'guess',
    })

    expect(checks).toEqual([{ storedHash: undefined, password: 'guess' }])
  })
})

import type { PlayerId } from '#player/PlayerId'
import type { Accounts } from '../domain/Accounts'
import { inMemoryAccounts } from './inMemoryAccounts'

export const signedUpAccountsOf = (playerIds: ReadonlyArray<PlayerId>): Accounts =>
  inMemoryAccounts(
    playerIds.map((id) => ({
      id,
      email: `${id}@example.com`,
      passwordHash: 'argon2id-hash',
      emailVerified: true,
      scaffold: 'es',
      scaffoldVersion: 0,
    })),
  )

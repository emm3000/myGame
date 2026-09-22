import type { Clock, PlayerId } from '@mygame/domain'
import type { DrizzleAccounts, Session } from '../adapters/postgres/DrizzleAccounts'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import { sessionExpiryFrom } from './sessionExpiryFrom'

export type OpenSessionDependencies = {
  readonly accounts: DrizzleAccounts
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
}

export const openSession = async (
  playerId: PlayerId,
  { accounts, clock, sessionTokens }: OpenSessionDependencies,
): Promise<Session> => {
  const session = {
    token: sessionTokens.newToken(),
    playerId,
    expiresAt: sessionExpiryFrom(clock.now()),
  }
  await accounts.openSession(session)
  return session
}

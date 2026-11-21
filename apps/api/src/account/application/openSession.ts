import type { Clock, PlayerId } from '@mygame/domain'
import type { Accounts, Session } from './ports/Accounts'
import type { SessionTokens } from './ports/SessionTokens'
import { sessionExpiryFrom } from './sessionExpiryFrom'

export type OpenSessionDependencies = {
  readonly accounts: Accounts
  readonly clock: Clock
  readonly sessionTokens: SessionTokens
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

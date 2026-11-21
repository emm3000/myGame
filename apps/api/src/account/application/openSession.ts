import type { Clock, PlayerId } from '@mygame/domain'
import type { Session, Sessions } from './ports/Sessions'
import type { SessionTokens } from './ports/SessionTokens'
import { sessionExpiryFrom } from './sessionExpiryFrom'

export type OpenSessionDependencies = {
  readonly sessions: Sessions
  readonly clock: Clock
  readonly sessionTokens: SessionTokens
}

export const openSession = async (
  playerId: PlayerId,
  { sessions, clock, sessionTokens }: OpenSessionDependencies,
): Promise<Session> => {
  const session = {
    token: sessionTokens.newToken(),
    playerId,
    expiresAt: sessionExpiryFrom(clock.now()),
  }
  await sessions.openSession(session)
  return session
}

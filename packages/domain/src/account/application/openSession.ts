import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import type { Session, Sessions } from '../domain/Sessions'
import type { SessionTokens } from '../domain/SessionTokens'
import { sessionExpiryFrom } from '../domain/sessionExpiryFrom'

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

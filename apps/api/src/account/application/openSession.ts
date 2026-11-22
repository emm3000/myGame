import {
  type Clock,
  type PlayerId,
  type Session,
  type Sessions,
  type SessionTokens,
  sessionExpiryFrom,
} from '@mygame/domain'

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

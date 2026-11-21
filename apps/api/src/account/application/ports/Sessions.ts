import type { Instant, PlayerId } from '@mygame/domain'

export type Session = {
  readonly token: string
  readonly playerId: PlayerId
  readonly expiresAt: Instant
}

export interface Sessions {
  openSession(session: Session): Promise<void>
  renewSession(token: string, now: Instant, expiresAt: Instant): Promise<PlayerId | undefined>
  closeSession(token: string): Promise<void>
  closeSessionsOf(playerId: PlayerId): Promise<void>
}

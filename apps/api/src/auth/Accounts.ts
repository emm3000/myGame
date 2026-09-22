import type { Instant, PlayerId } from '@mygame/domain'

export type NewPlayer = {
  readonly id: PlayerId
  readonly email: string
  readonly passwordHash: string
  readonly createdAt: Instant
}

export type StoredPlayer = {
  readonly id: PlayerId
  readonly email: string
}

export type PlayerCredentials = StoredPlayer & {
  readonly passwordHash: string
}

export type Session = {
  readonly token: string
  readonly playerId: PlayerId
  readonly expiresAt: Instant
}

export type PlayerAdded = 'added' | 'emailTaken'

export interface Accounts {
  addPlayer(player: NewPlayer): Promise<PlayerAdded>
  credentialsOf(email: string): Promise<PlayerCredentials | undefined>
  playerOf(playerId: PlayerId): Promise<StoredPlayer | undefined>
  openSession(session: Session): Promise<void>
  renewSession(token: string, now: Instant, expiresAt: Instant): Promise<PlayerId | undefined>
  closeSession(token: string): Promise<void>
}

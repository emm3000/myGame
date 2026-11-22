import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'
import type { StoredScaffold } from './StoredScaffold'

export type NewPlayer = {
  readonly id: PlayerId
  readonly email: string
  readonly passwordHash: string
  readonly createdAt: Instant
  readonly scaffold: Scaffold
}

export type StoredPlayer = StoredScaffold & {
  readonly id: PlayerId
  readonly email: string
  readonly emailVerified: boolean
}

export type PlayerCredentials = StoredPlayer & {
  readonly passwordHash: string
}

export type PlayerAdded =
  | { readonly kind: 'added'; readonly player: StoredPlayer }
  | { readonly kind: 'emailTaken' }

export interface Accounts {
  addPlayer(player: NewPlayer): Promise<PlayerAdded>
  credentialsOf(email: string): Promise<PlayerCredentials | undefined>
  playerOf(playerId: PlayerId): Promise<StoredPlayer | undefined>
  lockPlayer(playerId: PlayerId): Promise<void>
  markEmailVerified(playerId: PlayerId, now: Instant): Promise<void>
  storePasswordHash(playerId: PlayerId, passwordHash: string): Promise<void>
  storeScaffold(playerId: PlayerId, scaffold: Scaffold): Promise<StoredPlayer>
}

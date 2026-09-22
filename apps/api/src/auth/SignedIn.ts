import type { Session, StoredPlayer } from '../adapters/postgres/DrizzleAccounts'

export type SignedIn = {
  readonly player: StoredPlayer
  readonly session: Session
}

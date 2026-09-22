import type { Session, StoredPlayer } from './Accounts'

export type SignedIn = {
  readonly player: StoredPlayer
  readonly session: Session
}

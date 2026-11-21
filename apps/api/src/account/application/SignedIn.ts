import type { Session, StoredPlayer } from './ports/Accounts'

export type SignedIn = {
  readonly player: StoredPlayer
  readonly session: Session
}

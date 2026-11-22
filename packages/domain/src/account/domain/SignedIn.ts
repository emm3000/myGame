import type { StoredPlayer } from './Accounts'
import type { Session } from './Sessions'

export type SignedIn = {
  readonly player: StoredPlayer
  readonly session: Session
}

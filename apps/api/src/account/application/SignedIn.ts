import type { StoredPlayer } from './ports/Accounts'
import type { Session } from './ports/Sessions'

export type SignedIn = {
  readonly player: StoredPlayer
  readonly session: Session
}

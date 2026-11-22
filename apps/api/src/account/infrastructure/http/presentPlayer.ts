import type { Player } from '@mygame/contracts'
import type { ChromePhase, StoredPlayer } from '@mygame/domain'
import { presentScaffold } from './presentScaffold'

export const presentPlayer = (stored: StoredPlayer, chromePhase: ChromePhase): Player => ({
  id: stored.id,
  email: stored.email,
  emailVerified: stored.emailVerified,
  ...presentScaffold(stored),
  chromePhase,
})

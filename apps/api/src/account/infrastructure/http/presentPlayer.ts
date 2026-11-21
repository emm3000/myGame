import type { Player } from '@mygame/contracts'
import type { StoredPlayer } from '../../application/ports/Accounts'
import {
  type ReadChromePhaseDependencies,
  readChromePhase,
} from '../../application/readChromePhase'
import { presentScaffold } from './presentScaffold'

export const presentPlayer = async (
  stored: StoredPlayer,
  dependencies: ReadChromePhaseDependencies,
): Promise<Player> => ({
  id: stored.id,
  email: stored.email,
  emailVerified: stored.emailVerified,
  ...presentScaffold(stored),
  chromePhase: await readChromePhase(stored, dependencies),
})

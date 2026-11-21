import type { Player } from '@mygame/contracts'
import type { StoredPlayer } from '../../application/ports/Accounts'
import {
  type PlayerChromePhaseDependencies,
  playerChromePhaseOf,
} from '../../application/readChromePhase'
import { scaffoldBodyOf } from './presentScaffold'

export const playerBodyOf = async (
  stored: StoredPlayer,
  dependencies: PlayerChromePhaseDependencies,
): Promise<Player> => ({
  id: stored.id,
  email: stored.email,
  emailVerified: stored.emailVerified,
  ...scaffoldBodyOf(stored),
  chromePhase: await playerChromePhaseOf(stored, dependencies),
})

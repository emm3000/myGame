import type { Player } from '@mygame/contracts'
import type { StoredPlayer } from '../auth/Accounts'
import {
  type PlayerChromePhaseDependencies,
  playerChromePhaseOf,
} from '../learning/playerChromePhaseOf'
import { scaffoldBodyOf } from '../learning/scaffoldBodyOf'

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

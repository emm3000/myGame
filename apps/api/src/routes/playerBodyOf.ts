import type { Player } from '@mygame/contracts'
import type { StoredPlayer } from '../auth/Accounts'
import {
  type PlayerChromePhaseDependencies,
  playerChromePhaseOf,
} from '../learning/playerChromePhaseOf'

export const playerBodyOf = async (
  stored: StoredPlayer,
  dependencies: PlayerChromePhaseDependencies,
): Promise<Player> => ({
  id: stored.id,
  email: stored.email,
  emailVerified: stored.emailVerified,
  scaffold: stored.scaffold,
  chromePhase: await playerChromePhaseOf(stored, dependencies),
})

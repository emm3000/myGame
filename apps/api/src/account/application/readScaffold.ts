import type { PlayerId, Scaffold } from '@mygame/domain'
import type { Accounts } from './ports/Accounts'

export const readScaffold = async (
  playerId: PlayerId,
  accounts: Pick<Accounts, 'playerOf'>,
): Promise<Scaffold> => {
  const player = await accounts.playerOf(playerId)
  if (player === undefined) {
    throw new Error(`Player ${playerId} holds no account`)
  }
  return player.scaffold
}

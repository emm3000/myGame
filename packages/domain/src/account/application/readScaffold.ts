import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { PlayerId } from '#player/PlayerId'
import type { Accounts } from '../domain/Accounts'

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

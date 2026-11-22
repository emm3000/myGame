import type { DomainError } from '#DomainError'
import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Accounts } from '../domain/Accounts'

export const readScaffold = async (
  playerId: PlayerId,
  accounts: Pick<Accounts, 'playerOf'>,
): Promise<Result<Scaffold, DomainError>> => {
  const player = await accounts.playerOf(playerId)
  if (player === undefined) {
    return err({ kind: 'AccountNotFound', playerId })
  }
  return ok(player.scaffold)
}

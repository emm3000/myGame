import type { ResetPasswordRequest } from '@mygame/contracts'
import { type Clock, err, ok, type Result } from '@mygame/domain'
import type { AccountStores } from '../account/application/ports/AccountStores'
import type { PasswordHasher } from '../account/application/ports/PasswordHasher'
import type { Transaction } from '../platform/application/ports/Transaction'
import type { Refusal } from '../platform/application/Refusal'

export type ResetPasswordDependencies = {
  readonly inTransaction: Transaction<AccountStores>
  readonly clock: Clock
  readonly passwords: PasswordHasher
}

export const resetPassword = async (
  request: ResetPasswordRequest,
  { inTransaction, clock, passwords }: ResetPasswordDependencies,
): Promise<Result<void, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  return inTransaction<void, Refusal>(async ({ accounts, accountTokens }) => {
    const playerId = await accountTokens.redeem(request.token, 'reset', clock.now())
    if (playerId === undefined) {
      return err({ kind: 'TokenInvalid' })
    }
    await accounts.storePasswordHash(playerId, passwordHash)
    await accounts.closeSessionsOf(playerId)
    return ok(undefined)
  })
}

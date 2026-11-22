import { type Clock, err, ok, type Refusal, type Result } from '@mygame/domain'
import type { Transaction } from '#platform/application/ports/Transaction'
import type { AccountStores } from './ports/AccountStores'
import type { PasswordHasher } from './ports/PasswordHasher'

export type ResetPasswordDependencies = {
  readonly inTransaction: Transaction<AccountStores>
  readonly clock: Clock
  readonly passwords: PasswordHasher
}

export const resetPassword = async (
  request: { readonly token: string; readonly password: string },
  { inTransaction, clock, passwords }: ResetPasswordDependencies,
): Promise<Result<void, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  return inTransaction<void, Refusal>(async ({ accounts, accountTokens, sessions }) => {
    const playerId = await accountTokens.redeem(request.token, 'reset', clock.now())
    if (playerId === undefined) {
      return err({ kind: 'TokenInvalid' })
    }
    await accounts.storePasswordHash(playerId, passwordHash)
    await sessions.closeSessionsOf(playerId)
    return ok(undefined)
  })
}

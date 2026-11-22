import { type Clock, err, ok, type Refusal, type Result, type UnitOfWork } from '@mygame/domain'
import type { AccountStores } from './ports/AccountStores'
import type { PasswordHasher } from './ports/PasswordHasher'

export type ResetPasswordDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly passwords: PasswordHasher
}

export const resetPassword = async (
  request: { readonly token: string; readonly password: string },
  { unitOfWork, clock, passwords }: ResetPasswordDependencies,
): Promise<Result<void, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  return unitOfWork.transact<void, Refusal>(async ({ accounts, accountTokens, sessions }) => {
    const playerId = await accountTokens.redeem(request.token, 'reset', clock.now())
    if (playerId === undefined) {
      return err({ kind: 'TokenInvalid' })
    }
    await accounts.storePasswordHash(playerId, passwordHash)
    await sessions.closeSessionsOf(playerId)
    return ok(undefined)
  })
}

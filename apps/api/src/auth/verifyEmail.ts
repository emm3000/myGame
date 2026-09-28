import type { VerifyEmailRequest } from '@mygame/contracts'
import { type Clock, err, ok, type Result } from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { Refusal } from '../http/Refusal'

export type VerifyEmailDependencies = {
  readonly inTransaction: Transaction
  readonly clock: Clock
}

export const verifyEmail = (
  request: VerifyEmailRequest,
  { inTransaction, clock }: VerifyEmailDependencies,
): Promise<Result<void, Refusal>> =>
  inTransaction<void, Refusal>(async ({ accounts, accountTokens }) => {
    const now = clock.now()
    const playerId = await accountTokens.redeem(request.token, 'verify', now)
    if (playerId === undefined) {
      return err({ kind: 'TokenInvalid' })
    }
    await accounts.markEmailVerified(playerId, now)
    return ok(undefined)
  })

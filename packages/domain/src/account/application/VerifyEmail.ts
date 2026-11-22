import type { Clock } from '#platform/domain/Clock'
import type { Refusal } from '#platform/domain/Refusal'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import { err, ok, type Result } from '#Result'
import type { AccountStores } from '../domain/AccountStores'

export type VerifyEmailDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
}

export class VerifyEmail {
  constructor(private readonly dependencies: VerifyEmailDependencies) {}

  async execute(request: { readonly token: string }): Promise<Result<void, Refusal>> {
    const { unitOfWork, clock } = this.dependencies
    return unitOfWork.transact<void, Refusal>(async ({ accounts, accountTokens }) => {
      const now = clock.now()
      const playerId = await accountTokens.redeem(request.token, 'verify', now)
      if (playerId === undefined) {
        return err({ kind: 'TokenInvalid' })
      }
      await accounts.markEmailVerified(playerId, now)
      return ok(undefined)
    })
  }
}

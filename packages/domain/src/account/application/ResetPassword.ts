import type { Clock } from '#platform/domain/Clock'
import type { Refusal } from '#platform/domain/Refusal'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import { err, ok, type Result } from '#Result'
import type { AccountStores } from '../domain/AccountStores'
import type { PasswordHasher } from '../domain/PasswordHasher'

export type ResetPasswordDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly passwords: PasswordHasher
}

export class ResetPassword {
  constructor(private readonly dependencies: ResetPasswordDependencies) {}

  async execute(request: {
    readonly token: string
    readonly password: string
  }): Promise<Result<void, Refusal>> {
    const { unitOfWork, clock, passwords } = this.dependencies
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
}

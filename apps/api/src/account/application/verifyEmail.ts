import {
  type AccountStores,
  type Clock,
  err,
  ok,
  type Refusal,
  type Result,
  type UnitOfWork,
} from '@mygame/domain'

export type VerifyEmailDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
}

export const verifyEmail = (
  request: { readonly token: string },
  { unitOfWork, clock }: VerifyEmailDependencies,
): Promise<Result<void, Refusal>> =>
  unitOfWork.transact<void, Refusal>(async ({ accounts, accountTokens }) => {
    const now = clock.now()
    const playerId = await accountTokens.redeem(request.token, 'verify', now)
    if (playerId === undefined) {
      return err({ kind: 'TokenInvalid' })
    }
    await accounts.markEmailVerified(playerId, now)
    return ok(undefined)
  })

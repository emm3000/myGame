import type { Clock } from '#platform/domain/Clock'
import type { Refusal } from '#platform/domain/Refusal'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import { err, ok, type Result } from '#Result'
import type { AccountStores } from '../domain/AccountStores'
import type { PasswordHasher } from '../domain/PasswordHasher'
import type { SessionTokens } from '../domain/SessionTokens'
import type { SignedIn } from '../domain/SignedIn'
import { openSession } from './openSession'

export type SignInDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly passwords: PasswordHasher
  readonly sessionTokens: SessionTokens
}

export class SignIn {
  constructor(private readonly dependencies: SignInDependencies) {}

  async execute(request: {
    readonly email: string
    readonly password: string
  }): Promise<Result<SignedIn, Refusal>> {
    const { unitOfWork, clock, passwords, sessionTokens } = this.dependencies
    const read = await unitOfWork.transact(async ({ accounts }) =>
      ok(await accounts.credentialsOf(request.email)),
    )
    const credentials = read.ok ? read.value : undefined
    const isMatch = await passwords.matches(credentials?.passwordHash, request.password)
    if (credentials === undefined || !isMatch) {
      return err({ kind: 'InvalidCredentials' })
    }
    const { passwordHash: _, ...player } = credentials
    return unitOfWork.transact(async ({ sessions }) =>
      ok({ player, session: await openSession(player.id, { sessions, clock, sessionTokens }) }),
    )
  }
}

import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { Clock } from '#platform/domain/Clock'
import type { IdGenerator } from '#platform/domain/IdGenerator'
import type { Refusal } from '#platform/domain/Refusal'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import { err, ok, type Result } from '#Result'
import type { AccountStores } from '../domain/AccountStores'
import type { PasswordHasher } from '../domain/PasswordHasher'
import type { SessionTokens } from '../domain/SessionTokens'
import type { SignedIn } from '../domain/SignedIn'
import { issueAccountToken } from './issueAccountToken'
import { openSession } from './openSession'
import { type SendVerificationMailDependencies, sendVerificationMail } from './sendVerificationMail'

export type SignUpDependencies = SendVerificationMailDependencies & {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly passwords: PasswordHasher
  readonly sessionTokens: SessionTokens
}

type SignUpRequest = {
  readonly email: string
  readonly password: string
  readonly scaffold: Scaffold
}

type SignedUp = SignedIn & {
  readonly verifyToken: string
}

const addSignedInPlayer = (
  request: SignUpRequest,
  passwordHash: string,
  { unitOfWork, clock, ids, sessionTokens }: SignUpDependencies,
): Promise<Result<SignedUp, Refusal>> =>
  unitOfWork.transact<SignedUp, Refusal>(async ({ accounts, accountTokens, sessions }) => {
    const added = await accounts.addPlayer({
      id: ids.newId(),
      email: request.email,
      passwordHash,
      createdAt: clock.now(),
      scaffold: request.scaffold,
    })
    if (added.kind === 'emailTaken') {
      return err({ kind: 'EmailTaken' })
    }
    const { player } = added
    const session = await openSession(player.id, { sessions, clock, sessionTokens })
    const verifyToken = await issueAccountToken('verify', player.id, {
      accountTokens,
      clock,
      sessionTokens,
    })
    return ok({ player, session, verifyToken })
  })

export class SignUp {
  constructor(private readonly dependencies: SignUpDependencies) {}

  async execute(request: SignUpRequest): Promise<Result<SignedIn, Refusal>> {
    const passwordHash = await this.dependencies.passwords.hashOf(request.password)
    const signedUp = await addSignedInPlayer(request, passwordHash, this.dependencies)
    if (!signedUp.ok) {
      return signedUp
    }
    const { player, session, verifyToken } = signedUp.value
    await sendVerificationMail(player, verifyToken, this.dependencies)
    return ok({ player, session })
  }
}

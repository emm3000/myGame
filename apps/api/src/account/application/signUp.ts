import {
  type AccountStores,
  type Clock,
  err,
  type IdGenerator,
  ok,
  type PasswordHasher,
  type Refusal,
  type Result,
  type Scaffold,
  type SessionTokens,
  type SignedIn,
  type UnitOfWork,
} from '@mygame/domain'
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

type SignedUp = SignedIn & {
  readonly verifyToken: string
}

export const signUp = async (
  request: { readonly email: string; readonly password: string; readonly scaffold: Scaffold },
  {
    unitOfWork,
    clock,
    ids,
    passwords,
    sessionTokens,
    mailer,
    mailCopy,
    webUrl,
  }: SignUpDependencies,
): Promise<Result<SignedIn, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  const signedUp = await unitOfWork.transact<SignedUp, Refusal>(
    async ({ accounts, accountTokens, sessions }) => {
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
    },
  )
  if (!signedUp.ok) {
    return signedUp
  }
  const { player, session, verifyToken } = signedUp.value
  await sendVerificationMail(player, verifyToken, { mailer, mailCopy, webUrl })
  return ok({ player, session })
}

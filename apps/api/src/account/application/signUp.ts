import {
  type Clock,
  err,
  type IdGenerator,
  ok,
  type Refusal,
  type Result,
  type Scaffold,
} from '@mygame/domain'
import type { Transaction } from '#platform/application/ports/Transaction'
import { issueAccountToken } from './issueAccountToken'
import { openSession } from './openSession'
import type { AccountStores } from './ports/AccountStores'
import type { PasswordHasher } from './ports/PasswordHasher'
import type { SessionTokens } from './ports/SessionTokens'
import type { SignedIn } from './SignedIn'
import { type SendVerificationMailDependencies, sendVerificationMail } from './sendVerificationMail'

export type SignUpDependencies = SendVerificationMailDependencies & {
  readonly inTransaction: Transaction<AccountStores>
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
  { inTransaction, clock, ids, passwords, sessionTokens, mailer, webUrl }: SignUpDependencies,
): Promise<Result<SignedIn, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  const signedUp = await inTransaction<SignedUp, Refusal>(
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
  await sendVerificationMail(player, verifyToken, { mailer, webUrl })
  return ok({ player, session })
}

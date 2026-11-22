import {
  type Clock,
  err,
  ok,
  type PlayerId,
  type Refusal,
  type Result,
  type UnitOfWork,
} from '@mygame/domain'
import { issueAccountToken } from './issueAccountToken'
import type { MailRecipient } from './MailRecipient'
import type { AccountStores } from './ports/AccountStores'
import type { SessionTokens } from './ports/SessionTokens'
import { type SendVerificationMailDependencies, sendVerificationMail } from './sendVerificationMail'

export type ResendVerificationMailDependencies = SendVerificationMailDependencies & {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly sessionTokens: SessionTokens
}

type VerifyLink = {
  readonly recipient: MailRecipient
  readonly token: string
}

export const resendVerificationMail = async (
  playerId: PlayerId,
  {
    unitOfWork,
    clock,
    sessionTokens,
    mailer,
    mailCopy,
    webUrl,
  }: ResendVerificationMailDependencies,
): Promise<Result<void, Refusal>> => {
  const issued = await unitOfWork.transact<VerifyLink | undefined, Refusal>(
    async ({ accounts, accountTokens }) => {
      const player = await accounts.playerOf(playerId)
      if (player === undefined) {
        return err({ kind: 'SignedOut' })
      }
      if (player.emailVerified) {
        return ok(undefined)
      }
      const token = await issueAccountToken('verify', playerId, {
        accountTokens,
        clock,
        sessionTokens,
      })
      return ok({ recipient: { email: player.email, scaffold: player.scaffold }, token })
    },
  )
  if (!issued.ok) {
    return err(issued.error)
  }
  if (issued.value === undefined) {
    return ok(undefined)
  }
  const delivery = await sendVerificationMail(issued.value.recipient, issued.value.token, {
    mailer,
    mailCopy,
    webUrl,
  })
  return delivery === 'sent' ? ok(undefined) : err({ kind: 'MailNotSent' })
}

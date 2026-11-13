import { type Clock, err, ok, type PlayerId, type Result } from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import type { Refusal } from '../http/Refusal'
import { issueAccountToken } from './issueAccountToken'
import type { MailRecipient } from './MailRecipient'
import { type SendVerificationMailDependencies, sendVerificationMail } from './sendVerificationMail'

export type ResendVerificationMailDependencies = SendVerificationMailDependencies & {
  readonly inTransaction: Transaction
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
}

type VerifyLink = {
  readonly recipient: MailRecipient
  readonly token: string
}

export const resendVerificationMail = async (
  playerId: PlayerId,
  { inTransaction, clock, sessionTokens, mailer, webUrl }: ResendVerificationMailDependencies,
): Promise<Result<void, Refusal>> => {
  const issued = await inTransaction<VerifyLink | undefined, Refusal>(
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
    webUrl,
  })
  return delivery === 'sent' ? ok(undefined) : err({ kind: 'MailNotSent' })
}

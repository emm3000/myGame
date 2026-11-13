import type { ForgotPasswordRequest } from '@mygame/contracts'
import { type Clock, ok } from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import { fixedCopyOf } from './fixedCopyOf'
import { issueAccountToken } from './issueAccountToken'
import type { Mailer } from './Mailer'
import type { MailRecipient } from './MailRecipient'

export type RequestPasswordResetDependencies = {
  readonly inTransaction: Transaction
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
  readonly mailer: Mailer
  readonly webUrl: string
}

type ResetLink = {
  readonly recipient: MailRecipient
  readonly token: string
}

export const requestPasswordReset = async (
  request: ForgotPasswordRequest,
  { inTransaction, clock, sessionTokens, mailer, webUrl }: RequestPasswordResetDependencies,
): Promise<void> => {
  const issued = await inTransaction<ResetLink | undefined, never>(
    async ({ accounts, accountTokens }) => {
      const player = await accounts.credentialsOf(request.email)
      if (player === undefined || !player.emailVerified) {
        return ok(undefined)
      }
      const token = await issueAccountToken('reset', player.id, {
        accountTokens,
        clock,
        sessionTokens,
      })
      return ok({ recipient: { email: player.email, scaffold: player.scaffold }, token })
    },
  )
  if (!issued.ok || issued.value === undefined) {
    return
  }
  const { recipient, token } = issued.value
  const copy = fixedCopyOf(recipient.scaffold)
  await mailer.send({
    to: recipient.email,
    subject: copy.mailResetSubject(),
    text: copy.mailResetText({ link: `${webUrl}/reset-password?token=${token}` }),
  })
}

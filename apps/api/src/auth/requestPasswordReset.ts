import type { ForgotPasswordRequest } from '@mygame/contracts'
import { type Clock, ok } from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import { mailCopy } from '../mail/mailCopy'
import { issueAccountToken } from './issueAccountToken'
import type { Mailer } from './Mailer'

export type RequestPasswordResetDependencies = {
  readonly inTransaction: Transaction
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
  readonly mailer: Mailer
  readonly webUrl: string
}

type ResetLink = {
  readonly email: string
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
      return ok({ email: player.email, token })
    },
  )
  if (!issued.ok || issued.value === undefined) {
    return
  }
  await mailer.send({
    to: issued.value.email,
    subject: mailCopy.reset.subject,
    text: mailCopy.reset.textWith(`${webUrl}/reset-password?token=${issued.value.token}`),
  })
}

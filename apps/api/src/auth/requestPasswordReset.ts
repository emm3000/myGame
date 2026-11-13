import type { ForgotPasswordRequest } from '@mygame/contracts'
import { type Clock, ok } from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import type { AfterResponse } from '../afterResponse/AfterResponse'
import type { FailureSink } from '../failures/FailureSink'
import { thrownCauseOf } from '../failures/thrownCauseOf'
import { fixedCopyOf } from './fixedCopyOf'
import { issueAccountToken } from './issueAccountToken'
import type { MailDelivery, Mailer } from './Mailer'
import type { MailRecipient } from './MailRecipient'

export type RequestPasswordResetDependencies = {
  readonly inTransaction: Transaction
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
  readonly mailer: Mailer
  readonly webUrl: string
  readonly afterResponse: AfterResponse
  readonly failureSink: FailureSink
}

type ResetLink = {
  readonly recipient: MailRecipient
  readonly token: string
}

const resetRequestLine = (cause: string): string => `reset request ${cause}`

const sendResetMail = async (
  request: ForgotPasswordRequest,
  { inTransaction, clock, sessionTokens, mailer, webUrl }: RequestPasswordResetDependencies,
): Promise<MailDelivery | undefined> => {
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
    return undefined
  }
  const { recipient, token } = issued.value
  const copy = fixedCopyOf(recipient.scaffold)
  return mailer.send({
    to: recipient.email,
    subject: copy.mailResetSubject(),
    text: copy.mailResetText({ link: `${webUrl}/reset-password?token=${token}` }),
  })
}

export const requestPasswordReset = (
  request: ForgotPasswordRequest,
  dependencies: RequestPasswordResetDependencies,
): void => {
  const { afterResponse, failureSink } = dependencies
  const reportUnsent = (delivery: MailDelivery | undefined): void => {
    if (delivery === 'failed') {
      failureSink.write(resetRequestLine('MailNotSent'))
    }
  }
  const reportThrown = (error: unknown): void => {
    failureSink.write(
      resetRequestLine(error instanceof Error ? thrownCauseOf(error) : typeof error),
    )
  }
  afterResponse.defer(sendResetMail(request, dependencies).then(reportUnsent, reportThrown))
}

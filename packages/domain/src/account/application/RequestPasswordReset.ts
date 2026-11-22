import type { AfterResponse } from '#platform/domain/AfterResponse'
import type { Clock } from '#platform/domain/Clock'
import type { FailureSink } from '#platform/domain/FailureSink'
import { thrownCauseOf } from '#platform/domain/thrownCauseOf'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import { ok } from '#Result'
import type { AccountStores } from '../domain/AccountStores'
import type { MailCopy } from '../domain/MailCopy'
import type { MailDelivery, Mailer } from '../domain/Mailer'
import type { MailRecipient } from '../domain/MailRecipient'
import type { SessionTokens } from '../domain/SessionTokens'
import { issueAccountToken } from './issueAccountToken'

export type RequestPasswordResetDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly sessionTokens: SessionTokens
  readonly mailer: Mailer
  readonly mailCopy: MailCopy
  readonly webUrl: string
  readonly afterResponse: AfterResponse
  readonly failureSink: FailureSink
}

type ResetRequest = { readonly email: string }

type ResetLink = {
  readonly recipient: MailRecipient
  readonly token: string
}

const resetRequestLine = (cause: string): string => `reset request ${cause}`

const sendResetMail = async (
  request: ResetRequest,
  { unitOfWork, clock, sessionTokens, mailer, mailCopy, webUrl }: RequestPasswordResetDependencies,
): Promise<MailDelivery | undefined> => {
  const issued = await unitOfWork.transact<ResetLink | undefined, never>(
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
  return mailer.send({
    to: recipient.email,
    ...mailCopy.resetMail(recipient.scaffold, `${webUrl}/reset-password?token=${token}`),
  })
}

export class RequestPasswordReset {
  constructor(private readonly dependencies: RequestPasswordResetDependencies) {}

  async execute(request: ResetRequest): Promise<void> {
    const { afterResponse, failureSink } = this.dependencies
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
    afterResponse.defer(() =>
      sendResetMail(request, this.dependencies).then(reportUnsent, reportThrown),
    )
  }
}

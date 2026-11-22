import {
  type AfterResponse,
  type Clock,
  type FailureSink,
  ok,
  thrownCauseOf,
  type UnitOfWork,
} from '@mygame/domain'
import { issueAccountToken } from './issueAccountToken'
import type { MailRecipient } from './MailRecipient'
import { pickFixedCopy } from './pickFixedCopy'
import type { AccountStores } from './ports/AccountStores'
import type { MailDelivery, Mailer } from './ports/Mailer'
import type { SessionTokens } from './ports/SessionTokens'

export type RequestPasswordResetDependencies = {
  readonly unitOfWork: UnitOfWork<AccountStores>
  readonly clock: Clock
  readonly sessionTokens: SessionTokens
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
  request: { readonly email: string },
  { unitOfWork, clock, sessionTokens, mailer, webUrl }: RequestPasswordResetDependencies,
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
  const copy = pickFixedCopy(recipient.scaffold)
  return mailer.send({
    to: recipient.email,
    subject: copy.mailResetSubject(),
    text: copy.mailResetText({ link: `${webUrl}/reset-password?token=${token}` }),
  })
}

export const requestPasswordReset = (
  request: { readonly email: string },
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
  afterResponse.defer(() => sendResetMail(request, dependencies).then(reportUnsent, reportThrown))
}

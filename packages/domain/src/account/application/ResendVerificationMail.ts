import type { Clock } from '#platform/domain/Clock'
import type { Refusal } from '#platform/domain/Refusal'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { AccountStores } from '../domain/AccountStores'
import type { MailRecipient } from '../domain/MailRecipient'
import type { SessionTokens } from '../domain/SessionTokens'
import { issueAccountToken } from './issueAccountToken'
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

const issueVerifyLink = (
  playerId: PlayerId,
  { unitOfWork, clock, sessionTokens }: ResendVerificationMailDependencies,
): Promise<Result<VerifyLink | undefined, Refusal>> =>
  unitOfWork.transact<VerifyLink | undefined, Refusal>(async ({ accounts, accountTokens }) => {
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
  })

export class ResendVerificationMail {
  constructor(private readonly dependencies: ResendVerificationMailDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<void, Refusal>> {
    const issued = await issueVerifyLink(playerId, this.dependencies)
    if (!issued.ok) {
      return err(issued.error)
    }
    if (issued.value === undefined) {
      return ok(undefined)
    }
    const delivery = await sendVerificationMail(
      issued.value.recipient,
      issued.value.token,
      this.dependencies,
    )
    return delivery === 'sent' ? ok(undefined) : err({ kind: 'MailNotSent' })
  }
}

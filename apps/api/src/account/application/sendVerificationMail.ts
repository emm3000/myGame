import type { MailRecipient } from './MailRecipient'
import type { MailCopy } from './ports/MailCopy'
import type { MailDelivery, Mailer } from './ports/Mailer'

export type SendVerificationMailDependencies = {
  readonly mailer: Mailer
  readonly mailCopy: MailCopy
  readonly webUrl: string
}

export const sendVerificationMail = (
  { email, scaffold }: MailRecipient,
  token: string,
  { mailer, mailCopy, webUrl }: SendVerificationMailDependencies,
): Promise<MailDelivery> =>
  mailer.send({
    to: email,
    ...mailCopy.verificationMail(scaffold, `${webUrl}/verify-email?token=${token}`),
  })

import type { MailCopy, MailDelivery, Mailer, MailRecipient } from '@mygame/domain'

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

import { mailCopy } from '../mail/mailCopy'
import type { MailDelivery, Mailer } from './Mailer'

export type SendVerificationMailDependencies = {
  readonly mailer: Mailer
  readonly webUrl: string
}

export const sendVerificationMail = (
  email: string,
  token: string,
  { mailer, webUrl }: SendVerificationMailDependencies,
): Promise<MailDelivery> =>
  mailer.send({
    to: email,
    subject: mailCopy.verification.subject,
    text: mailCopy.verification.textWith(`${webUrl}/verify-email?token=${token}`),
  })

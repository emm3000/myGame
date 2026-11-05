import { mailVerificationSubject, mailVerificationText } from '@mygame/catalog'
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
    subject: mailVerificationSubject(),
    text: mailVerificationText({ link: `${webUrl}/verify-email?token=${token}` }),
  })

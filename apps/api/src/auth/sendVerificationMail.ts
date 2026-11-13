import { fixedCopyOf } from './fixedCopyOf'
import type { MailDelivery, Mailer } from './Mailer'
import type { MailRecipient } from './MailRecipient'

export type SendVerificationMailDependencies = {
  readonly mailer: Mailer
  readonly webUrl: string
}

export const sendVerificationMail = (
  { email, scaffold }: MailRecipient,
  token: string,
  { mailer, webUrl }: SendVerificationMailDependencies,
): Promise<MailDelivery> => {
  const copy = fixedCopyOf(scaffold)
  return mailer.send({
    to: email,
    subject: copy.mailVerificationSubject(),
    text: copy.mailVerificationText({ link: `${webUrl}/verify-email?token=${token}` }),
  })
}

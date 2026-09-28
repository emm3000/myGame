import { createTransport } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import type { Mail, MailDelivery, Mailer } from '../../auth/Mailer'

const timeoutMilliseconds = {
  connectionTimeout: 3000,
  greetingTimeout: 2000,
  socketTimeout: 3000,
}

export class SmtpMailer implements Mailer {
  private readonly transport

  constructor(smtpUrl: string, from: string) {
    this.transport = createTransport(new SMTPTransport({ url: smtpUrl, ...timeoutMilliseconds }), {
      from,
    })
  }

  async send(mail: Mail): Promise<MailDelivery> {
    try {
      await this.transport.sendMail({ to: mail.to, subject: mail.subject, text: mail.text })
      return 'sent'
    } catch {
      return 'failed'
    }
  }
}

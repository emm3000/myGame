import { createTransport } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import type { Mail, MailDelivery, Mailer } from '../../auth/Mailer'

export class SmtpMailer implements Mailer {
  private readonly transport

  constructor(smtpUrl: string, from: string) {
    this.transport = createTransport(new SMTPTransport(smtpUrl), { from })
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

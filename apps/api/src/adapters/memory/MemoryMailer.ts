import type { Mail, MailDelivery, Mailer } from '../../auth/Mailer'

export class MemoryMailer implements Mailer {
  private readonly sent: Array<Mail> = []

  constructor(private readonly delivery: MailDelivery = 'sent') {}

  static failing(): MemoryMailer {
    return new MemoryMailer('failed')
  }

  async send(mail: Mail): Promise<MailDelivery> {
    if (this.delivery === 'sent') {
      this.sent.push(mail)
    }
    return this.delivery
  }

  sentTo(recipient: string): ReadonlyArray<Mail> {
    return this.sent.filter((mail) => mail.to === recipient)
  }
}

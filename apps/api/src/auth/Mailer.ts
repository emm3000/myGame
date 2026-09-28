export type Mail = {
  readonly to: string
  readonly subject: string
  readonly text: string
}

export type MailDelivery = 'sent' | 'failed'

export interface Mailer {
  send(mail: Mail): Promise<MailDelivery>
}

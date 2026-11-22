import type { Scaffold } from '#learning/scaffold/Scaffold'
import type { Mail } from './Mailer'

export type MailWording = Pick<Mail, 'subject' | 'text'>

export interface MailCopy {
  verificationMail(scaffold: Scaffold, link: string): MailWording
  resetMail(scaffold: Scaffold, link: string): MailWording
}

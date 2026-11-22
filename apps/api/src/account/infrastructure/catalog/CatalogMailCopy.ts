import { en, es } from '@mygame/catalog'
import type { MailCopy, MailWording, Scaffold } from '@mygame/domain'

const copyFor = (scaffold: Scaffold): typeof en | typeof es => (scaffold === 'none' ? en : es)

export class CatalogMailCopy implements MailCopy {
  verificationMail(scaffold: Scaffold, link: string): MailWording {
    const copy = copyFor(scaffold)
    return { subject: copy.mailVerificationSubject(), text: copy.mailVerificationText({ link }) }
  }

  resetMail(scaffold: Scaffold, link: string): MailWording {
    const copy = copyFor(scaffold)
    return { subject: copy.mailResetSubject(), text: copy.mailResetText({ link }) }
  }
}

import { en, es } from '@mygame/catalog'
import type { Scaffold } from '@mygame/domain'
import type { MailCopy, MailWording } from '../../application/ports/MailCopy'

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

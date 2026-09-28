import { describe, expect, it } from 'vitest'
import type { Mail, Mailer } from '../auth/Mailer'

export type MailerFixture = {
  readonly mailer: Mailer
  readonly unreachableMailer: Mailer
  readonly deliveredTo: (recipient: string) => Promise<ReadonlyArray<Mail>>
}

const verificationMail: Mail = {
  to: 'aldonza@example.com',
  subject: 'Confirma tu correo',
  text: 'Sigue este enlace para confirmar tu correo: http://localhost:3259/verify-email?token=abc',
}

export const mailerContract = (adapter: string, arrange: () => Promise<MailerFixture>): void => {
  describe(`${adapter} as a mailer`, () => {
    it('delivers a mail to its recipient', async () => {
      const { mailer, deliveredTo } = await arrange()

      const delivery = await mailer.send(verificationMail)

      expect([delivery, (await deliveredTo(verificationMail.to)).length]).toEqual(['sent', 1])
    })

    it('delivers the subject and the text as given', async () => {
      const { mailer, deliveredTo } = await arrange()

      await mailer.send(verificationMail)

      expect(await deliveredTo(verificationMail.to)).toEqual([verificationMail])
    })

    it('delivers nothing to another recipient', async () => {
      const { mailer, deliveredTo } = await arrange()

      await mailer.send(verificationMail)

      expect(await deliveredTo('sancho@example.com')).toEqual([])
    })

    it('answers failed when the server cannot be reached', async () => {
      const { unreachableMailer } = await arrange()

      expect(await unreachableMailer.send(verificationMail)).toBe('failed')
    })
  })
}

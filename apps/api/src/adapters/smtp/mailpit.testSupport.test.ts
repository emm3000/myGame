import { describe, expect, it } from 'vitest'
import { deleteMailTo, deliveredTo } from './mailpit.testSupport'
import { SmtpMailer } from './SmtpMailer'

const smtpUrl = (): string => {
  const url = process.env.SMTP_URL
  if (!url) {
    throw new Error('SMTP_URL is not set')
  }
  return url
}

const mailer = (): SmtpMailer => new SmtpMailer(smtpUrl(), 'myGame <no-reply@mygame.local>')

const mailTo = (to: string): { to: string; subject: string; text: string } => ({
  to,
  subject: 'Confirm your email',
  text: 'Follow this link.',
})

describe('the Mailpit test support', () => {
  it("deletes one recipient's mail and keeps the mail another test file awaits", async () => {
    const cleanedUp = 'dulcinea@mailpit-support.example.com'
    const awaited = 'rocinante@mailpit-support.example.com'
    await mailer().send(mailTo(cleanedUp))
    await mailer().send(mailTo(awaited))

    await deleteMailTo([cleanedUp])

    expect([await deliveredTo(cleanedUp), await deliveredTo(awaited)]).toEqual([
      [],
      [mailTo(awaited)],
    ])
    await deleteMailTo([awaited])
  })
})

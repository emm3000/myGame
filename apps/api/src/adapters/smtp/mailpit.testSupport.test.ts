import { beforeEach, describe, expect, it } from 'vitest'
import type { Mail } from '../../auth/Mailer'
import { deleteMailTo, deliveredTo } from './mailpit.testSupport'
import { SmtpMailer } from './SmtpMailer'

const cleanedUp = 'dulcinea@mailpit-support.example.com'
const awaited = 'rocinante@mailpit-support.example.com'
const containedAddress = 'ana@mailpit-support.example.com'
const containingAddress = 'diana@mailpit-support.example.com'
const pastOnePage = 55

const smtpUrl = (): string => {
  const url = process.env.SMTP_URL
  if (!url) {
    throw new Error('SMTP_URL is not set')
  }
  return url
}

const mailer = (): SmtpMailer => new SmtpMailer(smtpUrl(), 'myGame <no-reply@mygame.local>')

const mailTo = (to: string): Mail => ({
  to,
  subject: 'Confirm your email',
  text: 'Follow this link.',
})

const sendMailsTo = async (to: string, count: number): Promise<void> => {
  for (let sent = 0; sent < count; sent += 1) {
    await mailer().send(mailTo(to))
  }
}

beforeEach(async () => {
  await deleteMailTo([cleanedUp, awaited, containedAddress, containingAddress])
})

describe('the Mailpit test support', () => {
  it("deletes the given recipient's mail", async () => {
    await mailer().send(mailTo(cleanedUp))

    await deleteMailTo([cleanedUp])

    expect(await deliveredTo(cleanedUp)).toEqual([])
  })

  it('deletes every mail of a recipient whose mail fills more than one search page', async () => {
    await sendMailsTo(cleanedUp, pastOnePage)

    await deleteMailTo([cleanedUp])

    expect(await deliveredTo(cleanedUp)).toEqual([])
  }, 30_000)

  it('keeps the mail another test file awaits', async () => {
    await mailer().send(mailTo(cleanedUp))
    await mailer().send(mailTo(awaited))

    await deleteMailTo([cleanedUp])

    expect(await deliveredTo(awaited)).toEqual([mailTo(awaited)])
  })

  it('keeps every other mail when the given recipient has none', async () => {
    await mailer().send(mailTo(awaited))

    await deleteMailTo([cleanedUp])

    expect(await deliveredTo(awaited)).toEqual([mailTo(awaited)])
  })

  it('keeps the mail of an address that contains the given one', async () => {
    await mailer().send(mailTo(containedAddress))
    await mailer().send(mailTo(containingAddress))

    await deleteMailTo([containedAddress])

    expect(await deliveredTo(containingAddress)).toEqual([mailTo(containingAddress)])
  })

  it("deletes the given recipient's mail behind a page of mail to an address that contains it", async () => {
    await mailer().send(mailTo(containedAddress))
    await sendMailsTo(containingAddress, pastOnePage)

    await deleteMailTo([containedAddress])

    expect(await deliveredTo(containedAddress)).toEqual([])
  }, 30_000)

  it('keeps every mail of an address that contains the given one past one search page', async () => {
    await mailer().send(mailTo(containedAddress))
    await sendMailsTo(containingAddress, pastOnePage)

    await deleteMailTo([containedAddress])

    expect(await deliveredTo(containingAddress)).toEqual(
      Array.from({ length: pastOnePage }, () => mailTo(containingAddress)),
    )
  }, 30_000)
})

import { createServer, type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Mail } from '../../auth/Mailer'
import { deleteMailTo, deliveredTo } from './mailpit.testSupport'
import { SmtpMailer } from './SmtpMailer'

const cleanedUp = 'dulcinea@mailpit-support.example.com'
const awaited = 'rocinante@mailpit-support.example.com'
const containedAddress = 'ana@mailpit-support.example.com'
const containingAddress = 'diana@mailpit-support.example.com'
const pastOnePage = 55

type SearchPage = {
  readonly start: string | null
  readonly limit: string | null
}

const mailpitUrl = (): string => {
  const url = process.env.MAILPIT_URL
  if (!url) {
    throw new Error('MAILPIT_URL is not set')
  }
  return url
}

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

const lateMail: Mail = {
  to: cleanedUp,
  subject: 'Reset your password',
  text: 'Follow this other link.',
}

const readRequestBytes = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

const searchPagesAskedWhile = async (
  work: () => Promise<void>,
  beforeSearch: (searchesSoFar: number) => Promise<void> = async () => {},
): Promise<ReadonlyArray<SearchPage>> => {
  const target = mailpitUrl()
  const searchPages: SearchPage[] = []
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', target)
    if (url.pathname === '/api/v1/search') {
      await beforeSearch(searchPages.length)
      searchPages.push({
        start: url.searchParams.get('start'),
        limit: url.searchParams.get('limit'),
      })
    }
    const body = await readRequestBytes(request)
    const forwarded = await fetch(url, {
      method: request.method ?? 'GET',
      headers: { 'content-type': 'application/json' },
      ...(body.length > 0 ? { body } : {}),
    })
    response.writeHead(forwarded.status, { 'content-type': 'application/json' })
    response.end(Buffer.from(await forwarded.arrayBuffer()))
  })
  await new Promise<void>((listening) => server.listen(0, '127.0.0.1', listening))
  process.env.MAILPIT_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try {
    await work()
  } finally {
    process.env.MAILPIT_URL = target
    await new Promise<void>((closed) => server.close(() => closed()))
  }
  return searchPages
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

  it('asks each next search page from where the last one ended until a page comes back short', async () => {
    await sendMailsTo(cleanedUp, pastOnePage)

    const searchPages = await searchPagesAskedWhile(() => deleteMailTo([cleanedUp]))

    expect(searchPages).toEqual([
      { start: '0', limit: '50' },
      { start: '50', limit: '50' },
    ])
  }, 30_000)

  it('sends no search with a zero limit for a recipient who has no mail', async () => {
    const searchPages = await searchPagesAskedWhile(() => deleteMailTo([cleanedUp]))

    expect(searchPages).toEqual([{ start: '0', limit: '50' }])
  })

  it('deletes the oldest mail of a recipient though a mail lands between two searches', async () => {
    await sendMailsTo(cleanedUp, pastOnePage)

    await searchPagesAskedWhile(
      () => deleteMailTo([cleanedUp]),
      async (searchesSoFar) => {
        if (searchesSoFar === 1) {
          await mailer().send(lateMail)
        }
      },
    )

    expect(await deliveredTo(cleanedUp)).toEqual([lateMail])
  }, 30_000)
})

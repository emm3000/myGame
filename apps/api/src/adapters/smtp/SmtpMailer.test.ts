import { createServer, type Server, type Socket } from 'node:net'
import { describe, expect, it } from 'vitest'
import type { Mail } from '../../auth/Mailer'
import { mailerContract } from '../mailerContract'
import { SmtpMailer } from './SmtpMailer'

const requiredVariable = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

const unreachableSmtpUrl = 'smtp://127.0.0.1:1'

const smtpLineEnd = /\r?\n$/

const sender = 'myGame <no-reply@mygame.local>'

type MailpitAddress = {
  readonly Address: string
}

type MailpitSummary = {
  readonly ID: string
  readonly To: ReadonlyArray<MailpitAddress>
}

type MailpitMessage = {
  readonly To: ReadonlyArray<MailpitAddress>
  readonly Subject: string
  readonly Text: string
}

const mailpitRequest = async (path: string, method: 'GET' | 'DELETE'): Promise<Response> => {
  const response = await fetch(new URL(path, requiredVariable('MAILPIT_URL')), { method })
  if (!response.ok) {
    throw new Error(`Mailpit answered ${response.status} to ${method} ${path}`)
  }
  return response
}

const mailpit = async <T>(path: string): Promise<T> =>
  (await (await mailpitRequest(path, 'GET')).json()) as T

const deliveredTo = async (recipient: string): Promise<ReadonlyArray<Mail>> => {
  const { messages } = await mailpit<{ messages: ReadonlyArray<MailpitSummary> }>(
    '/api/v1/messages',
  )
  const summaries = messages.filter((summary) =>
    summary.To.some((address) => address.Address === recipient),
  )
  const delivered = await Promise.all(
    summaries.map((summary) => mailpit<MailpitMessage>(`/api/v1/message/${summary.ID}`)),
  )
  return delivered.map((message) => ({
    to: recipient,
    subject: message.Subject,
    text: message.Text.replace(smtpLineEnd, ''),
  }))
}

mailerContract('SmtpMailer', async () => {
  await mailpitRequest('/api/v1/messages', 'DELETE')
  return {
    mailer: new SmtpMailer(requiredVariable('SMTP_URL'), sender),
    unreachableMailer: new SmtpMailer(unreachableSmtpUrl, sender),
    deliveredTo,
  }
})

type SilentServer = {
  readonly smtpUrl: string
  readonly close: () => Promise<void>
}

const listenSilently = async (): Promise<SilentServer> => {
  const sockets: Array<Socket> = []
  const server: Server = createServer((socket) => {
    sockets.push(socket)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('the silent server has no port')
  }
  return {
    smtpUrl: `smtp://127.0.0.1:${address.port}`,
    close: async () => {
      for (const socket of sockets) {
        socket.destroy()
      }
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

describe('SmtpMailer against a silent server', () => {
  it('answers failed when the server accepts and never greets', async () => {
    const silentServer = await listenSilently()

    try {
      const delivery = await new SmtpMailer(silentServer.smtpUrl, sender).send({
        to: 'aldonza@example.com',
        subject: 'Confirma tu correo',
        text: 'Sigue este enlace.',
      })

      expect(delivery).toBe('failed')
    } finally {
      await silentServer.close()
    }
  })
})

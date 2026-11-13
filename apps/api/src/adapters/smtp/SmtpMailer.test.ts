import { createServer, type Server, type Socket } from 'node:net'
import { describe, expect, it } from 'vitest'
import { mailerContract } from '../mailerContract'
import { deleteEveryMail, deliveredTo } from './mailpit.testSupport'
import { SmtpMailer } from './SmtpMailer'

const requiredVariable = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

const unreachableSmtpUrl = 'smtp://127.0.0.1:1'

const sender = 'myGame <no-reply@mygame.local>'

mailerContract('SmtpMailer', async () => {
  await deleteEveryMail()
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

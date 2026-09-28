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

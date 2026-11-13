import type { Mail } from '../../auth/Mailer'

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

const smtpLineEnd = /\r?\n$/

const smtpLineBreak = /\r\n/g

const mailpitUrl = (): string => {
  const url = process.env.MAILPIT_URL
  if (!url) {
    throw new Error('MAILPIT_URL is not set')
  }
  return url
}

const mailpitRequest = async (path: string, method: 'GET' | 'DELETE'): Promise<Response> => {
  const response = await fetch(new URL(path, mailpitUrl()), { method })
  if (!response.ok) {
    throw new Error(`Mailpit answered ${response.status} to ${method} ${path}`)
  }
  return response
}

const mailpit = async <T>(path: string): Promise<T> =>
  (await (await mailpitRequest(path, 'GET')).json()) as T

export const deleteEveryMail = async (): Promise<void> => {
  await mailpitRequest('/api/v1/messages', 'DELETE')
}

export const deliveredTo = async (recipient: string): Promise<ReadonlyArray<Mail>> => {
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
    text: message.Text.replace(smtpLineEnd, '').replace(smtpLineBreak, '\n'),
  }))
}

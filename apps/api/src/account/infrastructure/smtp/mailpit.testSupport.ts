import type { Mail } from '@mygame/domain'

type MailpitAddress = {
  readonly Address: string
}

type MailpitSummary = {
  readonly ID: string
  readonly To: ReadonlyArray<MailpitAddress>
}

type MailpitSearch = {
  readonly messages: ReadonlyArray<MailpitSummary>
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

const mailpitRequest = async (path: string, init: RequestInit): Promise<Response> => {
  const response = await fetch(new URL(path, mailpitUrl()), init)
  if (!response.ok) {
    throw new Error(`Mailpit answered ${response.status} to ${init.method} ${path}`)
  }
  return response
}

const mailpit = async <T>(path: string): Promise<T> =>
  (await (await mailpitRequest(path, { method: 'GET' })).json()) as T

const searchPageSize = 50

const searchOfMailTo = (recipient: string, start: number): Promise<MailpitSearch> =>
  mailpit<MailpitSearch>(
    `/api/v1/search?query=${encodeURIComponent(`to:"${recipient}"`)}&start=${start}&limit=${searchPageSize}`,
  )

const matchesFrom = async (
  recipient: string,
  start: number,
): Promise<ReadonlyArray<MailpitSummary>> => {
  const { messages } = await searchOfMailTo(recipient, start)
  if (messages.length < searchPageSize) {
    return messages
  }
  return [...messages, ...(await matchesFrom(recipient, start + searchPageSize))]
}

const summariesTo = async (recipient: string): Promise<ReadonlyArray<MailpitSummary>> => {
  const matches = await matchesFrom(recipient, 0)
  const uniqueMatches = [...new Map(matches.map((summary) => [summary.ID, summary])).values()]
  return uniqueMatches.filter((summary) =>
    summary.To.some((address) => address.Address === recipient),
  )
}

const deleteMessages = async (ids: ReadonlyArray<string>): Promise<void> => {
  if (ids.length === 0) {
    return
  }
  await mailpitRequest('/api/v1/messages', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ IDs: ids }),
  })
}

export const deleteMailTo = async (recipients: ReadonlyArray<string>): Promise<void> => {
  for (const recipient of recipients) {
    const summaries = await summariesTo(recipient)
    await deleteMessages(summaries.map((summary) => summary.ID))
  }
}

export const deliveredTo = async (recipient: string): Promise<ReadonlyArray<Mail>> => {
  const summaries = await summariesTo(recipient)
  const delivered = await Promise.all(
    summaries.map((summary) => mailpit<MailpitMessage>(`/api/v1/message/${summary.ID}`)),
  )
  return delivered.map((message) => ({
    to: recipient,
    subject: message.Subject,
    text: message.Text.replace(smtpLineEnd, '').replace(smtpLineBreak, '\n'),
  }))
}

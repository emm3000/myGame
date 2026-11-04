import { fileURLToPath } from 'node:url'
import { FiefListSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MemoryMailer } from '../adapters/memory/MemoryMailer'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'
import type { SeenHints } from '../hint/SeenHints'
import type { FailureSink } from './FailureSink'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const frozenClock: Clock = {
  now: () => Instant.fromEpochMilliseconds(Date.parse('2026-11-03T08:00:00Z')),
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

type CollectingSink = FailureSink & { readonly lines: ReadonlyArray<string> }

const collectingSink = (): CollectingSink => {
  const lines: Array<string> = []
  return { lines, write: (line) => lines.push(line) }
}

const anasEmail = 'ana@example.com'

const anasPassword = 'hierro-y-lana'

describe('the server failure report', () => {
  let server: ComposedServer
  let sink: CollectingSink
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    sink = collectingSink()
    app = createApp({ ...server, clock: frozenClock, failureSink: sink })
  })

  const signUpAna = async (): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: anasEmail, password: anasPassword, fiefName: 'Valdehierro' }),
    })
    expect(response.status).toBe(201)
    return sessionCookieOf(response)
  }

  it('writes one line naming the kind when a fief stored above the last building level answers 500', async () => {
    const ana = await signUpAna()
    await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
      SELECT id, 'sawmill'::building, 11 FROM fiefs
      ON CONFLICT (fief_id, building) DO UPDATE SET level = 11`)

    const response = await app.request('/fiefs', { headers: { cookie: ana } })

    expect(response.status).toBe(500)
    expect(sink.lines).toEqual(['GET /fiefs 500 UnknownBuildingLevel'])
  })

  it('writes nothing for a conflict refusal', async () => {
    const ana = await signUpAna()
    await runSql('UPDATE fiefs SET wood = 0, stone = 0, iron = 0, gold = 0, food = 0')
    const list = await app.request('/fiefs', { headers: { cookie: ana } })
    const [listed] = FiefListSchema.parse(await list.json()).fiefs

    const response = await app.request(`/fiefs/${listed?.id}/upgrades`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ana },
      body: JSON.stringify({ building: 'sawmill' }),
    })

    expect(response.status).toBe(409)
    expect(sink.lines).toEqual([])
  })

  it('writes one line naming the kind for an unsent mail', async () => {
    const ana = await signUpAna()
    const failingApp = createApp({
      ...server,
      clock: frozenClock,
      mailer: MemoryMailer.failing(),
      failureSink: sink,
    })

    const response = await failingApp.request('/auth/verify-email/resend', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ana },
      body: '{}',
    })

    expect(response.status).toBe(503)
    expect(sink.lines).toEqual(['POST /auth/verify-email/resend 503 MailNotSent'])
  })

  const unreachableHints: SeenHints = {
    markSeen: () => Promise.reject(new TypeError('the hints store is unreachable')),
    seenHintsOf: () => Promise.reject(new TypeError('the hints store is unreachable')),
  }

  const signInThroughUnreachableHints = async (session: string): Promise<Response> =>
    createApp({
      ...server,
      clock: frozenClock,
      seenHints: unreachableHints,
      failureSink: sink,
    }).request('/auth/sign-in', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: session,
        authorization: `Bearer ${session.replace('session=', '')}`,
      },
      body: JSON.stringify({ email: anasEmail, password: anasPassword }),
    })

  it('answers a thrown error with an empty 500', async () => {
    const ana = await signUpAna()

    const response = await signInThroughUnreachableHints(ana)

    expect({ status: response.status, body: await response.text() }).toEqual({
      status: 500,
      body: '',
    })
  })

  it('writes one line naming a thrown error and its message', async () => {
    const ana = await signUpAna()

    await signInThroughUnreachableHints(ana)

    expect(sink.lines).toEqual(['POST /auth/sign-in 500 TypeError: the hints store is unreachable'])
  })

  it('writes a line that omits the session token the request carried', async () => {
    const ana = await signUpAna()

    await signInThroughUnreachableHints(ana)

    expect(sink.lines.join('\n')).not.toContain(ana.replace('session=', ''))
  })

  it('writes a line that omits the email and the password the body carried', async () => {
    const ana = await signUpAna()

    await signInThroughUnreachableHints(ana)

    const written = sink.lines.join('\n')
    expect([written.includes(anasEmail), written.includes(anasPassword)]).toEqual([false, false])
  })
})

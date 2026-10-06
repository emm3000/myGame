import { fileURLToPath } from 'node:url'
import { PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant, type PlayerId } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const millisecondsPerHour = 3_600_000

const signedUpAt = Date.parse('2026-10-06T08:00:00Z')

type MovableClock = Clock & { readonly advanceHours: (hours: number) => void }

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  return {
    now: () => current,
    advanceHours: (hours) => {
      current = Instant.fromEpochMilliseconds(
        current.epochMilliseconds + hours * millisecondsPerHour,
      )
    },
  }
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

type SignedUpPlayer = {
  readonly cookie: string
  readonly playerId: PlayerId
}

describe('the digest acknowledgement route', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3197', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  const signUpAna = async (): Promise<SignedUpPlayer> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
        fiefName: 'Valdehierro',
      }),
    })
    const player = PlayerSchema.parse(await response.json())
    return { cookie: sessionCookieOf(response), playerId: player.id }
  }

  const acknowledge = async ({ cookie }: SignedUpPlayer): Promise<Response> =>
    app.request('/digest/acknowledgement', { method: 'POST', headers: { cookie } })

  it('stores the acknowledgement at the clock instant', async () => {
    const ana = await signUpAna()
    clock.advanceHours(5)

    const response = await acknowledge(ana)

    expect(response.status).toBe(204)
    expect(await server.digestAcknowledgements.acknowledgedAt(ana.playerId)).toEqual(clock.now())
  })

  it('refuses an acknowledgement without a session', async () => {
    const response = await app.request('/digest/acknowledgement', { method: 'POST' })

    expect(response.status).toBe(401)
  })

  it('reads the session without writing the acknowledgement', async () => {
    const ana = await signUpAna()
    clock.advanceHours(5)

    await app.request('/auth/session', { headers: { cookie: ana.cookie } })

    expect(await server.digestAcknowledgements.acknowledgedAt(ana.playerId)).toEqual(
      Instant.fromEpochMilliseconds(signedUpAt),
    )
  })
})

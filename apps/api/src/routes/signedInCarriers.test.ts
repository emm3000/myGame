import { fileURLToPath } from 'node:url'
import { FiefListSchema, PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const millisecondsPerDay = 86_400_000

type MovableClock = Clock & { readonly advanceDays: (days: number) => void }

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z'))
  return {
    now: () => current,
    advanceDays: (days) => {
      current = Instant.fromEpochMilliseconds(current.epochMilliseconds + days * millisecondsPerDay)
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

const truncateAccounts = async (): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(
      'TRUNCATE players, player_seen_hints, player_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
  } finally {
    await client.end()
  }
}

const anasSignUp = { email: 'ana@example.com', password: 'hierro-y-lana', fiefName: 'Valdehierro' }

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

const tokenOfCookie = (cookie: string): string => cookie.slice('session='.length)

const bearer = (token: string): string => `Bearer ${token}`

const sessionBearerScheme = 'sessionBearer'

const DocumentSchema = z.object({
  paths: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({ security: z.array(z.record(z.string(), z.array(z.string()))).optional() }),
    ),
  ),
})

const documentedPath = (path: string): string => path.replace(/:(\w+)/g, '{$1}')

const signOut = 'POST /auth/sign-out'

const pathParams = (fiefId: string): Readonly<Record<string, string>> => ({
  fiefId,
  building: 'sawmill',
  art: 'smithing',
  unit: 'infantry',
  targetLevel: '1',
  startedAt: '2026-09-22T08:00:00.000Z',
  departedAt: '2026-09-22T08:00:00.000Z',
  province: '1',
  hint: 'peasants',
})

type CarrierAnswers = {
  readonly operation: string
  readonly withCookie: number
  readonly withBearer: number
  readonly withNeither: string
}

describe('the signed-in carriers', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>
  let clock: MovableClock
  let cookie: string

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await truncateAccounts()
    clock = movableClock()
    app = createApp({ ...server, clock })
    const signedUp = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(anasSignUp),
    })
    cookie = sessionCookieOf(signedUp)
  })

  it('accepts a bearer token when no session cookie is present', async () => {
    const response = await app.request('/auth/session', {
      headers: { authorization: bearer(tokenOfCookie(cookie)) },
    })

    expect(response.status).toBe(200)
    expect(PlayerSchema.parse(await response.json()).email).toBe(anasSignUp.email)
  })

  const sessionWith = async (headers: Readonly<Record<string, string>>): Promise<Response> =>
    app.request('/auth/session', { headers })

  it('prefers the session cookie over a bearer token', async () => {
    const response = await sessionWith({ cookie, authorization: bearer('no-such-token') })

    expect(response.status).toBe(200)
  })

  it('refuses a dead session cookie even beside a live bearer token', async () => {
    const response = await sessionWith({
      cookie: 'session=no-such-token',
      authorization: bearer(tokenOfCookie(cookie)),
    })

    expect(response.status).toBe(401)
  })

  it('refuses a request with neither carrier', async () => {
    const response = await sessionWith({})

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('')
  })

  it('sets no cookie on a request carried by a bearer token', async () => {
    const response = await sessionWith({ authorization: bearer(tokenOfCookie(cookie)) })

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('slides the session expiry on a request carried by a bearer token', async () => {
    const authorization = bearer(tokenOfCookie(cookie))
    clock.advanceDays(20)
    await sessionWith({ authorization })

    clock.advanceDays(20)

    expect((await sessionWith({ authorization })).status).toBe(200)
  })

  const bearerTokenOfSignIn = async (): Promise<string> => {
    const signedIn = await app.request('/auth/sign-in', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: anasSignUp.email, password: anasSignUp.password }),
    })
    return tokenOfCookie(sessionCookieOf(signedIn))
  }

  const fiefIdOf = async (): Promise<string> => {
    const listed = await app.request('/fiefs', { headers: { cookie } })
    return FiefListSchema.parse(await listed.json()).fiefs[0]?.id ?? ''
  }

  const securedOperations = async (): Promise<ReadonlyArray<string>> => {
    const document = DocumentSchema.parse(await (await app.request('/openapi.json')).json())
    return Object.entries(document.paths)
      .flatMap(([path, operations]) =>
        Object.entries(operations)
          .filter(([, { security }]) =>
            (security ?? []).some((requirement) => Object.hasOwn(requirement, sessionBearerScheme)),
          )
          .map(([method]) => `${method.toUpperCase()} ${path}`),
      )
      .sort()
  }

  const servedOperations = (): ReadonlyArray<string> =>
    [
      ...new Set(
        app.routes
          .filter(({ method, path }) => method !== 'ALL' && path !== '/openapi.json')
          .map(({ method, path }) => `${method} ${documentedPath(path)}`),
      ),
    ].sort((left, right) => Number(left === signOut) - Number(right === signOut))

  it('answers every signed-in route through either carrier and refuses it with neither', async () => {
    const bearerToken = await bearerTokenOfSignIn()
    const params = pathParams(await fiefIdOf())
    const request = async (
      operation: string,
      carrier: Readonly<Record<string, string>>,
    ): Promise<Response> => {
      const [method = '', template = ''] = operation.split(' ')
      const path = template.replace(/\{(\w+)\}/g, (_match, name: string) =>
        encodeURIComponent(params[name] ?? `missing-${name}`),
      )
      const hasBody = method !== 'GET'
      return app.request(path, {
        method,
        headers: { ...carrier, ...(hasBody ? { 'content-type': 'application/json' } : {}) },
        ...(hasBody ? { body: '{}' } : {}),
      })
    }
    const answers: Array<CarrierAnswers> = []
    for (const operation of servedOperations()) {
      const withNeither = await request(operation, {})
      answers.push({
        operation,
        withNeither: `${withNeither.status} ${await withNeither.text()}`.trim(),
        withCookie: (await request(operation, { cookie })).status,
        withBearer: (await request(operation, { authorization: bearer(bearerToken) })).status,
      })
    }

    const secured = await securedOperations()
    expect(
      answers
        .filter(({ withNeither }) => withNeither === '401')
        .map(({ operation }) => operation)
        .sort(),
    ).toEqual(secured)
    expect(
      answers.filter(
        ({ operation, withCookie, withBearer }) =>
          secured.includes(operation) && (withCookie === 401 || withBearer === 401),
      ),
    ).toEqual([])
  })
})

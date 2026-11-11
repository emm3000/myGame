import { fileURLToPath } from 'node:url'
import type { RouteConfig } from '@hono/zod-openapi'
import { PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ZodType } from 'zod'
import { createApp } from './app'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'
import { authDeclarations } from './routes/authDeclarations'
import { healthDeclarations } from './routes/healthDeclarations'
import { learningDeclarations } from './routes/learningDeclarations'
import { reportDeclarations } from './routes/reportDeclarations'
import { townDeclarations } from './routes/townDeclarations'
import { townMapDeclarations } from './routes/townMapDeclarations'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

const frozenClock: Clock = {
  now: () => Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
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

const mounted: ReadonlyArray<readonly [string, Readonly<Record<string, RouteConfig>>]> = [
  ['', healthDeclarations],
  ['/auth', authDeclarations],
  ['/reviews', learningDeclarations],
  ['/report', reportDeclarations],
  ['/town', townDeclarations],
  ['/town/map', townMapDeclarations],
]

const declarationsByOperation = new Map<string, RouteConfig>(
  mounted.flatMap(([prefix, declarations]) =>
    Object.values(declarations).map((declaration): [string, RouteConfig] => [
      `${declaration.method.toUpperCase()} ${prefix}${declaration.path === '/' ? '' : declaration.path}`,
      declaration,
    ]),
  ),
)

type Caller = 'ana' | 'signedOut'

type Exchange = {
  readonly operation: string
  readonly caller: Caller
  readonly params?: Readonly<Record<string, string>>
  readonly seed?: string
  readonly body?: unknown
  readonly status: number
}

const exchanges: ReadonlyArray<Exchange> = [
  { operation: 'GET /health', caller: 'signedOut', status: 200 },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'hierro-y-lana' },
    status: 201,
  },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'dario@example.com', password: 'corta' },
    status: 400,
  },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'hierro-y-lana' },
    status: 409,
  },
  {
    operation: 'POST /auth/sign-in',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'hierro-y-lana' },
    status: 200,
  },
  {
    operation: 'POST /auth/sign-in',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'otra-clave-distinta' },
    status: 401,
  },
  {
    operation: 'POST /auth/sign-in/native',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'hierro-y-lana' },
    status: 200,
  },
  {
    operation: 'POST /auth/sign-in/native',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'otra-clave-distinta' },
    status: 401,
  },
  { operation: 'GET /auth/session', caller: 'ana', status: 200 },
  { operation: 'GET /auth/session', caller: 'signedOut', status: 401 },
  {
    operation: 'POST /auth/verify-email',
    caller: 'signedOut',
    body: { token: 'no-such-token' },
    status: 400,
  },
  { operation: 'POST /auth/verify-email/resend', caller: 'ana', status: 503 },
  { operation: 'POST /auth/verify-email/resend', caller: 'signedOut', status: 401 },
  {
    operation: 'POST /auth/forgot-password',
    caller: 'signedOut',
    body: { email: 'ana@example.com' },
    status: 202,
  },
  { operation: 'POST /auth/forgot-password', caller: 'signedOut', body: {}, status: 400 },
  {
    operation: 'POST /auth/reset-password',
    caller: 'signedOut',
    body: { token: 'no-such-token', password: 'hierro-y-lana' },
    status: 400,
  },
  {
    operation: 'POST /auth/reset-password',
    caller: 'signedOut',
    body: { token: 'no-such-token', password: 'corta' },
    status: 400,
  },
  { operation: 'GET /reviews', caller: 'ana', status: 200 },
  {
    operation: 'POST /reviews/{wordId}/hint',
    caller: 'ana',
    params: { wordId: 'lesson-1-1' },
    status: 409,
  },
  {
    operation: 'POST /reviews/{wordId}/answer',
    caller: 'ana',
    params: { wordId: 'lesson-1-1' },
    body: { answer: 'home' },
    status: 409,
  },
  {
    operation: 'POST /reviews/{wordId}/answer',
    caller: 'ana',
    params: { wordId: 'lesson-1-1' },
    body: { answer: 'home', rating: 'good' },
    status: 400,
  },
  { operation: 'GET /report', caller: 'ana', status: 200 },
  { operation: 'POST /report/close', caller: 'ana', status: 204 },
  { operation: 'GET /town', caller: 'signedOut', status: 401 },
  { operation: 'GET /town', caller: 'ana', status: 404 },
  { operation: 'GET /town/news', caller: 'signedOut', status: 401 },
  { operation: 'GET /town/news', caller: 'ana', status: 404 },
  {
    operation: 'POST /town/work',
    caller: 'signedOut',
    body: { building: 'farm' },
    status: 401,
  },
  { operation: 'POST /town/work', caller: 'ana', body: { building: 'farm' }, status: 404 },
  {
    operation: 'DELETE /town/work/{building}/{level}',
    caller: 'signedOut',
    params: { building: 'farm', level: '1' },
    status: 401,
  },
  {
    operation: 'DELETE /town/work/{building}/{level}',
    caller: 'ana',
    params: { building: 'farm', level: '1' },
    status: 404,
  },
  {
    operation: 'POST /town/hiring',
    caller: 'signedOut',
    body: { hire: 'worker', count: 1 },
    status: 401,
  },
  {
    operation: 'POST /town/hiring',
    caller: 'ana',
    body: { hire: 'worker', count: 1 },
    status: 404,
  },
  {
    operation: 'DELETE /town/hiring/{hire}/{startedAt}',
    caller: 'signedOut',
    params: { hire: 'worker', startedAt: '2026-09-22T08:00:00.000Z' },
    status: 401,
  },
  {
    operation: 'DELETE /town/hiring/{hire}/{startedAt}',
    caller: 'ana',
    params: { hire: 'worker', startedAt: '2026-09-22T08:00:00.000Z' },
    status: 404,
  },
  {
    operation: 'POST /town/lessons',
    caller: 'signedOut',
    body: { lessonId: 'lesson-1' },
    status: 401,
  },
  { operation: 'POST /town/lessons', caller: 'ana', body: { lessonId: 'lesson-1' }, status: 404 },
  {
    operation: 'DELETE /town/lessons/{lessonId}',
    caller: 'signedOut',
    params: { lessonId: 'lesson-1' },
    status: 401,
  },
  {
    operation: 'DELETE /town/lessons/{lessonId}',
    caller: 'ana',
    params: { lessonId: 'lesson-1' },
    status: 404,
  },
  { operation: 'GET /town/map', caller: 'signedOut', status: 401 },
  { operation: 'GET /town/map', caller: 'ana', status: 404 },
  { operation: 'GET /town/map/{area}', caller: 'signedOut', params: { area: '1' }, status: 401 },
  { operation: 'GET /town/map/{area}', caller: 'ana', params: { area: '1' }, status: 404 },
  {
    operation: 'POST /town/jobs',
    caller: 'signedOut',
    body: { site: { area: 1, site: 3 }, team: { worker: 1, truck: 0 }, hours: 1 },
    status: 401,
  },
  {
    operation: 'POST /town/jobs',
    caller: 'ana',
    body: { site: { area: 1, site: 3 }, team: { worker: 1, truck: 0 }, hours: 1 },
    status: 404,
  },
  {
    operation: 'POST /town/jobs/{sentAt}/call-back',
    caller: 'signedOut',
    params: { sentAt: '2026-09-22T08:00:00.000Z' },
    status: 401,
  },
  {
    operation: 'POST /town/jobs/{sentAt}/call-back',
    caller: 'ana',
    params: { sentAt: '2026-09-22T08:00:00.000Z' },
    status: 404,
  },
  { operation: 'POST /town', caller: 'signedOut', body: { name: 'Maple Falls' }, status: 401 },
  { operation: 'POST /town', caller: 'ana', body: { name: '   ' }, status: 400 },
  { operation: 'POST /town', caller: 'ana', body: { name: 'Maple Falls' }, status: 200 },
  { operation: 'POST /town', caller: 'ana', body: { name: 'Maple Falls' }, status: 409 },
  { operation: 'GET /town', caller: 'ana', status: 200 },
  { operation: 'POST /town/work', caller: 'ana', body: { building: 'stadium' }, status: 400 },
  { operation: 'POST /town/work', caller: 'ana', body: { building: 'farm' }, status: 200 },
  { operation: 'GET /town/news', caller: 'ana', status: 200 },
  {
    operation: 'DELETE /town/work/{building}/{level}',
    caller: 'ana',
    params: { building: 'farm', level: '0' },
    status: 400,
  },
  {
    operation: 'DELETE /town/work/{building}/{level}',
    caller: 'ana',
    params: { building: 'farm', level: '2' },
    status: 409,
  },
  {
    operation: 'DELETE /town/work/{building}/{level}',
    caller: 'ana',
    params: { building: 'farm', level: '1' },
    status: 200,
  },
  { operation: 'POST /town/lessons', caller: 'ana', body: {}, status: 400 },
  { operation: 'POST /town/lessons', caller: 'ana', body: { lessonId: 'lesson-1' }, status: 200 },
  { operation: 'POST /town/lessons', caller: 'ana', body: { lessonId: 'lesson-2' }, status: 409 },
  {
    operation: 'DELETE /town/lessons/{lessonId}',
    caller: 'ana',
    params: { lessonId: 'lesson-2' },
    status: 409,
  },
  {
    operation: 'DELETE /town/lessons/{lessonId}',
    caller: 'ana',
    params: { lessonId: 'lesson-1' },
    status: 200,
  },
  {
    operation: 'POST /town/hiring',
    caller: 'ana',
    body: { hire: 'worker', count: 0 },
    status: 400,
  },
  {
    operation: 'POST /town/hiring',
    caller: 'ana',
    body: { hire: 'worker', count: 1 },
    status: 409,
  },
  {
    operation: 'POST /town/hiring',
    caller: 'ana',
    seed: "UPDATE town_buildings SET level = 1 WHERE building = 'office'",
    body: { hire: 'worker', count: 1 },
    status: 200,
  },
  {
    operation: 'DELETE /town/hiring/{hire}/{startedAt}',
    caller: 'ana',
    params: { hire: 'worker', startedAt: 'yesterday' },
    status: 400,
  },
  {
    operation: 'DELETE /town/hiring/{hire}/{startedAt}',
    caller: 'ana',
    params: { hire: 'worker', startedAt: '2026-09-22T07:59:00.000Z' },
    status: 409,
  },
  {
    operation: 'DELETE /town/hiring/{hire}/{startedAt}',
    caller: 'ana',
    params: { hire: 'worker', startedAt: '2026-09-22T08:00:00.000Z' },
    status: 200,
  },
  { operation: 'GET /town/map', caller: 'ana', status: 200 },
  { operation: 'GET /town/map/{area}', caller: 'ana', params: { area: '0' }, status: 400 },
  { operation: 'GET /town/map/{area}', caller: 'ana', params: { area: '3' }, status: 404 },
  { operation: 'GET /town/map/{area}', caller: 'ana', params: { area: '2' }, status: 200 },
  {
    operation: 'POST /town/jobs',
    caller: 'ana',
    body: { site: { area: 1, site: 3 }, team: { worker: 0, truck: 0 }, hours: 1 },
    status: 400,
  },
  {
    operation: 'POST /town/jobs',
    caller: 'ana',
    body: { site: { area: 1, site: 3 }, team: { worker: 1, truck: 0 }, hours: 1 },
    status: 409,
  },
  {
    operation: 'POST /town/jobs',
    caller: 'ana',
    seed: "UPDATE town_hires SET count = 1 WHERE hire = 'worker'",
    body: { site: { area: 1, site: 3 }, team: { worker: 1, truck: 0 }, hours: 1 },
    status: 200,
  },
  {
    operation: 'POST /town/jobs/{sentAt}/call-back',
    caller: 'ana',
    params: { sentAt: 'yesterday' },
    status: 400,
  },
  {
    operation: 'POST /town/jobs/{sentAt}/call-back',
    caller: 'ana',
    params: { sentAt: '2026-09-22T07:59:00.000Z' },
    status: 409,
  },
  {
    operation: 'POST /town/jobs/{sentAt}/call-back',
    caller: 'ana',
    params: { sentAt: '2026-09-22T08:00:00.000Z' },
    status: 200,
  },
  {
    operation: 'POST /town/work',
    caller: 'ana',
    seed: 'UPDATE towns SET money = 0',
    body: { building: 'farm' },
    status: 409,
  },
  {
    operation: 'POST /auth/sign-up/native',
    caller: 'signedOut',
    body: { email: 'elena@example.com', password: 'hierro-y-lana' },
    status: 201,
  },
  {
    operation: 'POST /auth/sign-up/native',
    caller: 'signedOut',
    body: { email: 'dario@example.com', password: 'corta' },
    status: 400,
  },
  {
    operation: 'POST /auth/sign-up/native',
    caller: 'signedOut',
    body: { email: 'elena@example.com', password: 'hierro-y-lana' },
    status: 409,
  },
  { operation: 'POST /auth/sign-out', caller: 'ana', status: 204 },
  { operation: 'POST /auth/sign-out', caller: 'signedOut', status: 401 },
]

const statusesNoRequestReaches: ReadonlyArray<string> = ['DELETE /town/lessons/{lessonId} 400']

const describeExchange = ({ operation, caller, params, status }: Exchange): string =>
  `${operation} ${JSON.stringify(params ?? {})} as ${caller} answers ${status}`

const pathOf = (template: string, params: Readonly<Record<string, string>>): string =>
  template.replace(/\{(\w+)\}/g, (_match, name: string) => encodeURIComponent(params[name] ?? ''))

const declaredSchemaOf = (
  declaredResponse: RouteConfig['responses'][string] | undefined,
): unknown => {
  if (declaredResponse === undefined || !('content' in declaredResponse)) {
    return undefined
  }
  const declaredBody = declaredResponse.content?.['application/json']
  return declaredBody && 'schema' in declaredBody ? declaredBody.schema : undefined
}

describe('the OpenAPI conformance', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>
  let cookies: Readonly<Record<Caller, string>>

  const signUp = async (email: string): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana' }),
    })
    expect(response.status).toBe(201)
    PlayerSchema.parse(await response.json())
    return sessionCookieOf(response)
  }

  beforeAll(async () => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
    await runSql(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, earned_skills, band_starts, held_out_words, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    app = createApp({ ...server, clock: frozenClock })
    const ana = await signUp('ana@example.com')
    cookies = { ana, signedOut: '' }
  })

  afterAll(async () => {
    await server.close()
  })

  it('exercises every declared operation', () => {
    const exercised = new Set(exchanges.map(({ operation }) => operation))

    expect([...declarationsByOperation.keys()].filter((key) => !exercised.has(key)).sort()).toEqual(
      [],
    )
  })

  it('exercises every declared status of the town operations', () => {
    const exercised = new Set(exchanges.map(({ operation, status }) => `${operation} ${status}`))
    const declared = [...declarationsByOperation]
      .filter(([operation]) => operation.split(' ')[1]?.startsWith('/town'))
      .flatMap(([operation, declaration]) =>
        Object.keys(declaration.responses).map((status) => `${operation} ${status}`),
      )

    expect(declared.filter((key) => !exercised.has(key)).sort()).toEqual(statusesNoRequestReaches)
  })

  it.each(exchanges.map((exchange) => [describeExchange(exchange), exchange] as const))(
    '%s with a declared status and a body of its schema',
    async (_name, { operation, caller, params = {}, seed, body, status }) => {
      const [method = '', template = ''] = operation.split(' ')
      const path = pathOf(template, params)
      if (seed !== undefined) {
        await runSql(seed)
      }

      const response = await app.request(path, {
        method,
        headers: {
          ...(cookies[caller] === '' ? {} : { cookie: cookies[caller] }),
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })

      expect(response.status).toBe(status)
      const declaration = declarationsByOperation.get(operation)
      const declaredResponse = declaration?.responses[String(response.status)]
      expect(declaredResponse, `${operation} declares ${response.status}`).toBeDefined()
      const text = await response.text()
      if (text === '') {
        return
      }
      const schema = declaredSchemaOf(declaredResponse)
      expect(schema, `${operation} declares a body for ${response.status}`).toBeInstanceOf(ZodType)
      expect(schema instanceof ZodType && schema.safeParse(JSON.parse(text)).success).toBe(true)
    },
  )
})

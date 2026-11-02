import { fileURLToPath } from 'node:url'
import type { RouteConfig } from '@hono/zod-openapi'
import { FiefListSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ZodType } from 'zod'
import { createApp } from './app'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'
import { authDeclarations } from './routes/authDeclarations'
import { digestDeclarations } from './routes/digestDeclarations'
import { fiefDeclarations } from './routes/fiefDeclarations'
import { fiefsDeclarations } from './routes/fiefsDeclarations'
import { healthDeclarations } from './routes/healthDeclarations'
import { hintsDeclarations } from './routes/hintsDeclarations'
import { mapDeclarations } from './routes/mapDeclarations'

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
  ['/fiefs', fiefsDeclarations],
  ['/fiefs/{fiefId}', fiefDeclarations],
  ['/fiefs/{fiefId}/map', mapDeclarations],
  ['/digest', digestDeclarations],
  ['/hints', hintsDeclarations],
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
  readonly body?: unknown
  readonly status: number
}

const troops = { infantry: 1, cavalry: 0, archer: 0, settler: 0 }

const someCargo = { wood: 1, stone: 0, iron: 0, gold: 0, food: 0 }

const onForeignFief = (
  operation: string,
  params: Readonly<Record<string, string>> = {},
  body?: unknown,
): Exchange => ({
  operation,
  caller: 'ana',
  params: { fiefId: 'foreign', ...params },
  ...(body === undefined ? {} : { body }),
  status: 404,
})

const exchanges: ReadonlyArray<Exchange> = [
  { operation: 'GET /health', caller: 'signedOut', status: 200 },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'hierro-y-lana', fiefName: 'Pinares' },
    status: 201,
  },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'dario@example.com', password: 'corta', fiefName: 'Pinares' },
    status: 400,
  },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'carla@example.com', password: 'hierro-y-lana', fiefName: 'Pinares' },
    status: 409,
  },
  {
    operation: 'POST /auth/sign-up',
    caller: 'signedOut',
    body: { email: 'dario@example.com', password: 'hierro-y-lana', fiefName: '   ' },
    status: 400,
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
  { operation: 'GET /fiefs', caller: 'ana', status: 200 },
  { operation: 'GET /fiefs', caller: 'signedOut', status: 401 },
  { operation: 'GET /fiefs/{fiefId}', caller: 'ana', params: { fiefId: 'own' }, status: 200 },
  {
    operation: 'GET /fiefs/{fiefId}',
    caller: 'ana',
    params: { fiefId: 'not-a-uuid' },
    status: 400,
  },
  { operation: 'GET /fiefs/{fiefId}', caller: 'signedOut', params: { fiefId: 'own' }, status: 401 },
  { operation: 'GET /fiefs/{fiefId}', caller: 'ana', params: { fiefId: 'foreign' }, status: 404 },
  {
    operation: 'GET /fiefs/{fiefId}/events',
    caller: 'ana',
    params: { fiefId: 'own' },
    status: 200,
  },
  {
    operation: 'GET /fiefs/{fiefId}/events',
    caller: 'ana',
    params: { fiefId: 'foreign' },
    status: 404,
  },
  {
    operation: 'POST /fiefs/{fiefId}/upgrades',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { building: 'sawmill' },
    status: 200,
  },
  {
    operation: 'POST /fiefs/{fiefId}/upgrades',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { building: 'castle' },
    status: 400,
  },
  {
    operation: 'DELETE /fiefs/{fiefId}/upgrades/{building}/{targetLevel}',
    caller: 'ana',
    params: { fiefId: 'own', building: 'sawmill', targetLevel: '1' },
    status: 200,
  },
  {
    operation: 'DELETE /fiefs/{fiefId}/upgrades/{building}/{targetLevel}',
    caller: 'ana',
    params: { fiefId: 'own', building: 'sawmill', targetLevel: '1' },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/studies',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { art: 'smithing' },
    status: 200,
  },
  {
    operation: 'POST /fiefs/{fiefId}/studies',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { art: 'smithing' },
    status: 409,
  },
  {
    operation: 'DELETE /fiefs/{fiefId}/studies/{art}/{targetLevel}',
    caller: 'ana',
    params: { fiefId: 'own', art: 'smithing', targetLevel: '1' },
    status: 200,
  },
  {
    operation: 'DELETE /fiefs/{fiefId}/studies/{art}/{targetLevel}',
    caller: 'ana',
    params: { fiefId: 'own', art: 'smithing', targetLevel: '1' },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/recruit-orders',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { unit: 'infantry', count: 1 },
    status: 200,
  },
  {
    operation: 'POST /fiefs/{fiefId}/recruit-orders',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { unit: 'infantry', count: 1 },
    status: 409,
  },
  {
    operation: 'DELETE /fiefs/{fiefId}/recruit-orders/{unit}/{startedAt}',
    caller: 'ana',
    params: { fiefId: 'own', unit: 'infantry', startedAt: '2026-09-22T08:00:00.000Z' },
    status: 200,
  },
  {
    operation: 'DELETE /fiefs/{fiefId}/recruit-orders/{unit}/{startedAt}',
    caller: 'ana',
    params: { fiefId: 'own', unit: 'infantry', startedAt: '2026-09-22T08:00:00.000Z' },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches/transport',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { toFiefId: 'foreign', units: troops, cargo: someCargo },
    status: 404,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches/found',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { province: 1, plot: 9, name: '   ' },
    status: 400,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches/found',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { province: 1, plot: 9, name: 'Nuevo' },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { province: 1, plot: 4, units: troops, stayHours: 1 },
    status: 200,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { province: 1, plot: 4, units: troops, stayHours: 1 },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches/attack',
    caller: 'ana',
    params: { fiefId: 'own' },
    body: { province: 1, plot: 9, units: troops },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/marches/{departedAt}/recall',
    caller: 'ana',
    params: { fiefId: 'own', departedAt: '2026-01-01T00:00:00.000Z' },
    status: 409,
  },
  {
    operation: 'POST /fiefs/{fiefId}/guidance/dismissal',
    caller: 'ana',
    params: { fiefId: 'own' },
    status: 204,
  },
  {
    operation: 'POST /fiefs/{fiefId}/guidance/dismissal',
    caller: 'ana',
    params: { fiefId: 'foreign' },
    status: 404,
  },
  { operation: 'GET /fiefs/{fiefId}/map', caller: 'ana', params: { fiefId: 'own' }, status: 200 },
  {
    operation: 'GET /fiefs/{fiefId}/map/{province}',
    caller: 'ana',
    params: { fiefId: 'own', province: '1' },
    status: 200,
  },
  {
    operation: 'GET /fiefs/{fiefId}/map/{province}',
    caller: 'ana',
    params: { fiefId: 'own', province: '999' },
    status: 404,
  },
  { operation: 'GET /digest', caller: 'ana', status: 200 },
  { operation: 'POST /digest/acknowledgement', caller: 'ana', status: 204 },
  { operation: 'POST /hints/{hint}', caller: 'ana', params: { hint: 'peasants' }, status: 204 },
  { operation: 'POST /hints/{hint}', caller: 'ana', params: { hint: 'unknown' }, status: 400 },
  onForeignFief('POST /fiefs/{fiefId}/upgrades', {}, { building: 'sawmill' }),
  onForeignFief('DELETE /fiefs/{fiefId}/upgrades/{building}/{targetLevel}', {
    building: 'sawmill',
    targetLevel: '1',
  }),
  onForeignFief('POST /fiefs/{fiefId}/studies', {}, { art: 'smithing' }),
  onForeignFief('DELETE /fiefs/{fiefId}/studies/{art}/{targetLevel}', {
    art: 'smithing',
    targetLevel: '1',
  }),
  onForeignFief('POST /fiefs/{fiefId}/recruit-orders', {}, { unit: 'infantry', count: 1 }),
  onForeignFief('DELETE /fiefs/{fiefId}/recruit-orders/{unit}/{startedAt}', {
    unit: 'infantry',
    startedAt: '2026-09-22T08:00:00.000Z',
  }),
  onForeignFief(
    'POST /fiefs/{fiefId}/marches',
    {},
    { province: 1, plot: 4, units: troops, stayHours: 1 },
  ),
  onForeignFief('POST /fiefs/{fiefId}/marches/attack', {}, { province: 1, plot: 9, units: troops }),
  onForeignFief('POST /fiefs/{fiefId}/marches/found', {}, { province: 1, plot: 9, name: 'Nuevo' }),
  onForeignFief(
    'POST /fiefs/{fiefId}/marches/transport',
    {},
    { toFiefId: 'own', units: troops, cargo: someCargo },
  ),
  onForeignFief('POST /fiefs/{fiefId}/marches/{departedAt}/recall', {
    departedAt: '2026-01-01T00:00:00.000Z',
  }),
  onForeignFief('GET /fiefs/{fiefId}/map'),
  onForeignFief('GET /fiefs/{fiefId}/map/{province}', { province: '1' }),
  { operation: 'POST /auth/sign-out', caller: 'ana', status: 204 },
  { operation: 'POST /auth/sign-out', caller: 'signedOut', status: 401 },
]

const describeExchange = ({ operation, caller, params, status }: Exchange): string =>
  `${operation} ${JSON.stringify(params ?? {})} as ${caller} answers ${status}`

describe('the OpenAPI conformance', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>
  let cookies: Readonly<Record<Caller, string>>
  let fiefIds: Readonly<Record<string, string>>

  const signUp = async (email: string, fiefName: string): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana', fiefName }),
    })
    expect(response.status).toBe(201)
    return sessionCookieOf(response)
  }

  const firstFiefIdOf = async (cookie: string): Promise<string> => {
    const response = await app.request('/fiefs', { headers: { cookie } })
    const [fief] = FiefListSchema.parse(await response.json()).fiefs
    return fief?.id ?? ''
  }

  beforeAll(async () => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
    await runSql(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    app = createApp({ ...server, clock: frozenClock })
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')
    fiefIds = { own: await firstFiefIdOf(ana), foreign: await firstFiefIdOf(bruno) }
    await runSql(`INSERT INTO fief_buildings (fief_id, building, level)
      SELECT id, unnest(ARRAY['library', 'barracks']::building[]), 1 FROM fiefs`)
    await runSql(`INSERT INTO fief_units (fief_id, kind, count)
      SELECT id, 'infantry', 1 FROM fiefs`)
    await runSql(
      'UPDATE fiefs SET wood = 5000, stone = 5000, iron = 5000, gold = 5000, food = 5000',
    )
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

  it.each(exchanges.map((exchange) => [describeExchange(exchange), exchange] as const))(
    '%s with a declared status and a body of its schema',
    async (_name, { operation, caller, params = {}, body, status }) => {
      const [method = '', template = ''] = operation.split(' ')
      const path = template.replace(/\{(\w+)\}/g, (_match, name: string) =>
        encodeURIComponent(fiefIds[params[name] ?? ''] ?? params[name] ?? ''),
      )
      const resolvedBody =
        body === undefined
          ? undefined
          : JSON.parse(JSON.stringify(body), (_key, value: unknown) =>
              typeof value === 'string' && Object.hasOwn(fiefIds, value) ? fiefIds[value] : value,
            )

      const response = await app.request(path, {
        method,
        headers: {
          ...(cookies[caller] === '' ? {} : { cookie: cookies[caller] }),
          ...(resolvedBody === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(resolvedBody === undefined ? {} : { body: JSON.stringify(resolvedBody) }),
      })

      expect(response.status).toBe(status)
      const declaration = declarationsByOperation.get(operation)
      const declaredResponse = declaration?.responses[String(response.status)]
      expect(declaredResponse, `${operation} declares ${response.status}`).toBeDefined()
      const text = await response.text()
      if (text === '') {
        return
      }
      const declaredBody =
        declaredResponse && 'content' in declaredResponse
          ? declaredResponse.content?.['application/json']
          : undefined
      const schema = declaredBody && 'schema' in declaredBody ? declaredBody.schema : undefined
      expect(schema, `${operation} declares a body for ${response.status}`).toBeInstanceOf(ZodType)
      expect(schema instanceof ZodType && schema.safeParse(JSON.parse(text)).success).toBe(true)
    },
  )
})

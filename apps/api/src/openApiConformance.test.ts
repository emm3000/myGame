import type { RouteConfig } from '@hono/zod-openapi'
import { PlayerSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ZodType } from 'zod'
import { accountDeclarations } from './account/infrastructure/http/accountRoutes'
import { apiPackagePath } from './apiPackagePath.testSupport'
import { createApp } from './app'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'
import { learningDeclarations } from './learning/infrastructure/http/learningRoutes'
import { type Caller, type Exchange, exchanges } from './openApiExchanges.testSupport'
import { healthDeclarations } from './platform/infrastructure/http/healthDeclarations'
import { reportDeclarations } from './report/infrastructure/http/reportRoutes'
import { townDeclarations } from './town/infrastructure/http/townRoutes'
import { regionMapDeclarations } from './town/jobs/infrastructure/http/regionMapRoutes'
import { truncatePlayerTables } from './truncatePlayerTables.testSupport'

const contentDirectory = apiPackagePath('content/')

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
  ['', accountDeclarations],
  ['/reviews', learningDeclarations],
  ['/report', reportDeclarations],
  ['/town', townDeclarations],
  ['/town/map', regionMapDeclarations],
]

const declarationsByOperation = new Map<string, RouteConfig>(
  mounted.flatMap(([prefix, declarations]) =>
    Object.values(declarations).map((declaration): [string, RouteConfig] => [
      `${declaration.method.toUpperCase()} ${prefix}${declaration.path === '/' ? '' : declaration.path}`,
      declaration,
    ]),
  ),
)

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
      body: JSON.stringify({ email, password: 'hierro-y-lana', scaffold: 'es' }),
    })
    expect(response.status).toBe(201)
    PlayerSchema.parse(await response.json())
    return sessionCookieOf(response)
  }

  beforeAll(async () => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
    await runSql(truncatePlayerTables)
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

    expect(declared.filter((key) => !exercised.has(key)).sort()).toEqual([])
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
      await server.afterResponse.settled()

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

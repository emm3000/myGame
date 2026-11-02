import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createApp } from './app'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const documentedPath = (path: string): string => path.replace(/:(\w+)/g, '{$1}')

const DocumentSchema = z.object({
  paths: z.record(z.string(), z.record(z.string(), z.unknown())),
})

describe('the OpenAPI route coverage', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('declares every route the api serves', async () => {
    const app = createApp(server)
    const document = DocumentSchema.parse(await (await app.request('/openapi.json')).json())
    const declared = new Set(
      Object.entries(document.paths).flatMap(([path, operations]) =>
        Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`),
      ),
    )
    const served = new Set(
      app.routes
        .filter(({ method, path }) => method !== 'ALL' && path !== '/openapi.json')
        .map(({ method, path }) => `${method} ${documentedPath(path)}`),
    )

    expect([...served].filter((operation) => !declared.has(operation)).sort()).toEqual([])
  })
})

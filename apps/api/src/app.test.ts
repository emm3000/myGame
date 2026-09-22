import { fileURLToPath } from 'node:url'
import { HealthResponseSchema } from '@mygame/contracts'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { type ComposedServer, composeServer } from './composeServer'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

const unusedDatabaseUrl = 'postgres://composer@localhost:5432/unused'

describe('app', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ API_PORT: '3192', DATABASE_URL: unusedDatabaseUrl }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('answers the health route with a body the contract parses', async () => {
    const response = await createApp(server).request('/health')

    expect(response.status).toBe(200)
    expect(HealthResponseSchema.safeParse(await response.json()).success).toBe(true)
  })
})

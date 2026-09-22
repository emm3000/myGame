import type { Hono } from 'hono'
import { app } from './app'

export type ComposedServer = {
  readonly fetch: Hono['fetch']
  readonly port: number
}

export function composeServer(environment: NodeJS.ProcessEnv): ComposedServer {
  const port = Number(environment.API_PORT)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`API_PORT must be a positive integer, got ${environment.API_PORT}`)
  }
  return { fetch: app.fetch, port }
}

import type { Hono } from 'hono'
import { app } from './app'

const highestPort = 65535

export type ComposedServer = {
  readonly fetch: Hono['fetch']
  readonly port: number
}

export function composeServer(environment: NodeJS.ProcessEnv): ComposedServer {
  const port = Number(environment.API_PORT)
  if (!Number.isInteger(port) || port <= 0 || port > highestPort) {
    throw new Error(
      `API_PORT must be an integer from 1 to ${highestPort}, got ${environment.API_PORT}`,
    )
  }
  return { fetch: app.fetch, port }
}

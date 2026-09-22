import type { BuildingCatalog } from '@mygame/domain'
import type { Hono } from 'hono'
import { JsonBuildingCatalog } from './adapters/json/JsonBuildingCatalog'
import { app } from './app'

const highestPort = 65535

export type ComposedServer = {
  readonly fetch: Hono['fetch']
  readonly port: number
  readonly buildingCatalog: BuildingCatalog
}

export function composeServer(
  environment: NodeJS.ProcessEnv,
  contentDirectory: string,
): ComposedServer {
  const port = Number(environment.API_PORT)
  if (!Number.isInteger(port) || port <= 0 || port > highestPort) {
    throw new Error(
      `API_PORT must be an integer from 1 to ${highestPort}, got ${environment.API_PORT}`,
    )
  }
  const buildingCatalog = JsonBuildingCatalog.fromDirectory(contentDirectory)
  return { fetch: app.fetch, port, buildingCatalog }
}

import type { BuildingCatalog, Clock, FiefRepository, IdGenerator } from '@mygame/domain'
import type { Hono } from 'hono'
import { JsonBuildingCatalog } from './adapters/json/JsonBuildingCatalog'
import { connectPostgres } from './adapters/postgres/connectPostgres'
import { DrizzleFiefRepository } from './adapters/postgres/DrizzleFiefRepository'
import { CryptoIdGenerator } from './adapters/system/CryptoIdGenerator'
import { SystemClock } from './adapters/system/SystemClock'
import { app } from './app'

const highestPort = 65535

export type FiefTransaction = <T>(work: (fiefs: FiefRepository) => Promise<T>) => Promise<T>

export type ComposedServer = {
  readonly fetch: Hono['fetch']
  readonly port: number
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly fiefs: FiefRepository
  readonly inFiefTransaction: FiefTransaction
  readonly close: () => Promise<void>
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
  const databaseUrl = environment.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  const buildingCatalog = JsonBuildingCatalog.fromDirectory(contentDirectory)
  const { database, close } = connectPostgres(databaseUrl)
  const inFiefTransaction: FiefTransaction = (work) =>
    database.transaction((transaction) =>
      work(new DrizzleFiefRepository(transaction, 'lockedForUpdate')),
    )
  return {
    fetch: app.fetch,
    port,
    buildingCatalog,
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    fiefs: new DrizzleFiefRepository(database, 'lockFree'),
    inFiefTransaction,
    close,
  }
}

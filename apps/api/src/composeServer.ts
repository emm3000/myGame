import type { BuildingCatalog, Clock, FiefRepository, IdGenerator } from '@mygame/domain'
import type { Hono } from 'hono'
import { JsonBuildingCatalog } from './adapters/json/JsonBuildingCatalog'
import { connectPostgres } from './adapters/postgres/connectPostgres'
import { DrizzleAccounts } from './adapters/postgres/DrizzleAccounts'
import { DrizzleFiefRepository } from './adapters/postgres/DrizzleFiefRepository'
import { postgresTransaction, type Transaction } from './adapters/postgres/postgresTransaction'
import { Argon2Passwords } from './adapters/system/Argon2Passwords'
import { CryptoIdGenerator } from './adapters/system/CryptoIdGenerator'
import { CryptoSessionTokens } from './adapters/system/CryptoSessionTokens'
import { SystemClock } from './adapters/system/SystemClock'
import { createApp } from './app'

const highestPort = 65535

export type ComposedServer = {
  readonly fetch: Hono['fetch']
  readonly port: number
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly fiefs: FiefRepository
  readonly accounts: DrizzleAccounts
  readonly passwords: Argon2Passwords
  readonly sessionTokens: CryptoSessionTokens
  readonly inTransaction: Transaction
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
  const { database, close } = connectPostgres(databaseUrl)
  const dependencies = {
    buildingCatalog: JsonBuildingCatalog.fromDirectory(contentDirectory),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    accounts: new DrizzleAccounts(database),
    passwords: new Argon2Passwords(),
    sessionTokens: new CryptoSessionTokens(),
    inTransaction: postgresTransaction(database),
  }
  return {
    ...dependencies,
    fetch: createApp(dependencies).fetch,
    port,
    fiefs: new DrizzleFiefRepository(database, 'lockFree'),
    close,
  }
}

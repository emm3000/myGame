import type { BuildingCatalog, Clock, IdGenerator, KingdomMapReader } from '@mygame/domain'
import type { Hono } from 'hono'
import { JsonBuildingCatalog } from './adapters/json/JsonBuildingCatalog'
import { connectPostgres } from './adapters/postgres/connectPostgres'
import { DrizzleAccounts } from './adapters/postgres/DrizzleAccounts'
import { DrizzleChronicle } from './adapters/postgres/DrizzleChronicle'
import { DrizzleFiefRepository } from './adapters/postgres/DrizzleFiefRepository'
import { DrizzleKingdomMapReader } from './adapters/postgres/DrizzleKingdomMapReader'
import { postgresTransaction, type Transaction } from './adapters/postgres/postgresTransaction'
import { SmtpMailer } from './adapters/smtp/SmtpMailer'
import { Argon2Passwords } from './adapters/system/Argon2Passwords'
import { CryptoIdGenerator } from './adapters/system/CryptoIdGenerator'
import { CryptoSessionTokens } from './adapters/system/CryptoSessionTokens'
import { SystemClock } from './adapters/system/SystemClock'
import { createApp } from './app'
import type { Accounts } from './auth/Accounts'
import type { Mailer } from './auth/Mailer'
import type { ChronicleReader } from './fief/ChronicleReader'
import type { FiefReader } from './fief/FiefReader'

const highestPort = 65535

const isSessionCookieSecureFrom = (flag: string | undefined): boolean => {
  if (flag === undefined || flag === 'true') {
    return true
  }
  if (flag === 'false') {
    return false
  }
  throw new Error(`SESSION_COOKIE_SECURE must be true or false, got ${flag}`)
}

const urlWithProtocol = (
  name: string,
  value: string | undefined,
  protocols: ReadonlyArray<string>,
): string => {
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  const protocol = URL.canParse(value) ? new URL(value).protocol : undefined
  if (protocol === undefined || !protocols.includes(protocol)) {
    throw new Error(`${name} must be a ${protocols.join(' or ')} URL, got ${value}`)
  }
  return value
}

type MailSettings = {
  readonly mailer: Mailer
  readonly webUrl: string
}

const mailSettingsFrom = (environment: NodeJS.ProcessEnv): MailSettings => {
  const smtpUrl = urlWithProtocol('SMTP_URL', environment.SMTP_URL, ['smtp:', 'smtps:'])
  const sender = environment.MAIL_FROM
  if (!sender) {
    throw new Error('MAIL_FROM is not set')
  }
  return {
    mailer: new SmtpMailer(smtpUrl, sender),
    webUrl: urlWithProtocol('WEB_URL', environment.WEB_URL, ['http:', 'https:']),
  }
}

export type ComposedServer = MailSettings & {
  readonly fetch: Hono['fetch']
  readonly port: number
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly fiefs: FiefReader
  readonly chronicle: ChronicleReader
  readonly map: KingdomMapReader
  readonly accounts: Accounts
  readonly passwords: Argon2Passwords
  readonly sessionTokens: CryptoSessionTokens
  readonly inTransaction: Transaction
  readonly isSessionCookieSecure: boolean
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
  const isSessionCookieSecure = isSessionCookieSecureFrom(environment.SESSION_COOKIE_SECURE)
  const mail = mailSettingsFrom(environment)
  const { database, close } = connectPostgres(databaseUrl)
  const dependencies = {
    buildingCatalog: JsonBuildingCatalog.fromDirectory(contentDirectory),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    accounts: new DrizzleAccounts(database),
    passwords: new Argon2Passwords(),
    sessionTokens: new CryptoSessionTokens(),
    inTransaction: postgresTransaction(database),
    fiefs: new DrizzleFiefRepository(database, 'lockFree'),
    chronicle: new DrizzleChronicle(database),
    map: new DrizzleKingdomMapReader(database),
    isSessionCookieSecure,
  }
  return {
    ...dependencies,
    fetch: createApp(dependencies).fetch,
    port,
    ...mail,
    close,
  }
}

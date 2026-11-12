import { join } from 'node:path'
import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type CleanUpReader,
  type Clock,
  defaultMemoryTerms,
  type IdGenerator,
  type MemoryTerms,
  type PlacedOutBands,
  type RandomSource,
  type RegionMapReader,
  type TownCatalog,
} from '@mygame/domain'
import { JsonLessonCatalog } from './adapters/json/JsonLessonCatalog'
import { JsonTownCatalog } from './adapters/json/JsonTownCatalog'
import { connectPostgres } from './adapters/postgres/connectPostgres'
import { DrizzleAccounts } from './adapters/postgres/DrizzleAccounts'
import { DrizzleCardRepository } from './adapters/postgres/DrizzleCardRepository'
import { DrizzleCleanUpRepository } from './adapters/postgres/DrizzleCleanUpRepository'
import { DrizzleRegionMap } from './adapters/postgres/DrizzleRegionMap'
import { DrizzleReportClosings } from './adapters/postgres/DrizzleReportClosings'
import { DrizzleTownNews } from './adapters/postgres/DrizzleTownNews'
import { DrizzleTownRepository } from './adapters/postgres/DrizzleTownRepository'
import { postgresTransaction, type Transaction } from './adapters/postgres/postgresTransaction'
import { SmtpMailer } from './adapters/smtp/SmtpMailer'
import { Argon2Passwords } from './adapters/system/Argon2Passwords'
import { CryptoIdGenerator } from './adapters/system/CryptoIdGenerator'
import { CryptoRandomSource } from './adapters/system/CryptoRandomSource'
import { CryptoSessionTokens } from './adapters/system/CryptoSessionTokens'
import { NoPlacedOutBands } from './adapters/system/NoPlacedOutBands'
import { SystemClock } from './adapters/system/SystemClock'
import { createApp } from './app'
import type { Accounts } from './auth/Accounts'
import type { Mailer } from './auth/Mailer'
import type { FailureSink } from './http/FailureSink'
import type { CardReader } from './learning/CardReader'
import type { LessonLibrary } from './learning/LessonLibrary'
import type { ReportClosings } from './town/ReportClosings'
import type { TownNewsReader } from './town/TownNewsReader'
import type { TownReader } from './town/TownReader'

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

const standardErrorSink: FailureSink = {
  // biome-ignore lint/suspicious/noConsole: the composition root binds the failure sink to the process's standard error
  write: (line) => console.error(line),
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
    webUrl: urlWithProtocol('WEB_URL', environment.WEB_URL, ['http:', 'https:']).replace(/\/$/, ''),
  }
}

export type ComposedServer = MailSettings & {
  readonly fetch: OpenAPIHono['fetch']
  readonly lessons: LessonLibrary
  readonly townCatalog: TownCatalog
  readonly memoryTerms: MemoryTerms
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly random: RandomSource
  readonly placedOutBands: PlacedOutBands
  readonly towns: TownReader
  readonly townNews: TownNewsReader
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly cards: CardReader
  readonly accounts: Accounts
  readonly reportClosings: ReportClosings
  readonly passwords: Argon2Passwords
  readonly sessionTokens: CryptoSessionTokens
  readonly inTransaction: Transaction
  readonly isSessionCookieSecure: boolean
  readonly failureSink: FailureSink
  readonly close: () => Promise<void>
}

export function composeServer(
  environment: NodeJS.ProcessEnv,
  contentDirectory: string,
): ComposedServer {
  const databaseUrl = environment.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  const isSessionCookieSecure = isSessionCookieSecureFrom(environment.SESSION_COOKIE_SECURE)
  const mail = mailSettingsFrom(environment)
  const { database, close } = connectPostgres(databaseUrl)
  const lessons = JsonLessonCatalog.fromDirectory(contentDirectory)
  const dependencies = {
    lessons,
    townCatalog: JsonTownCatalog.fromDirectory(join(contentDirectory, 'town')),
    memoryTerms: defaultMemoryTerms,
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    random: new CryptoRandomSource(),
    placedOutBands: new NoPlacedOutBands(),
    accounts: new DrizzleAccounts(database),
    reportClosings: new DrizzleReportClosings(database),
    passwords: new Argon2Passwords(),
    sessionTokens: new CryptoSessionTokens(),
    inTransaction: postgresTransaction(database),
    towns: new DrizzleTownRepository(database, 'lockFree'),
    townNews: new DrizzleTownNews(database),
    regionMap: new DrizzleRegionMap(database),
    cleanUps: new DrizzleCleanUpRepository(database),
    cards: new DrizzleCardRepository(database),
    isSessionCookieSecure,
    failureSink: standardErrorSink,
    ...mail,
  }
  return {
    ...dependencies,
    fetch: createApp(dependencies).fetch,
    close,
  }
}

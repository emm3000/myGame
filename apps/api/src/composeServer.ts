import { join } from 'node:path'
import type { OpenAPIHono } from '@hono/zod-openapi'
import type {
  CardReader,
  LessonLibrary,
  ReadOnlyTowns,
  ReportClosings,
  SeenTowns,
  TownNewsReader,
  TownReader,
} from '@mygame/domain'
import {
  type Accounts,
  type AfterResponse,
  type AfterResponseDrain,
  type ChromeProgressReader,
  type CleanUpReader,
  type Clock,
  defaultMemoryTerms,
  type FailureSink,
  type IdGenerator,
  type MailCopy,
  type Mailer,
  type MemoryTerms,
  type PasswordHasher,
  type RandomSource,
  type RegionMapReader,
  type Sessions,
  type SessionTokens,
  type TownCatalog,
  type UnitOfWork,
} from '@mygame/domain'
import { waitUntil } from '@vercel/functions'
import { CatalogMailCopy } from '#account/infrastructure/catalog/CatalogMailCopy'
import { DrizzleAccounts } from '#account/infrastructure/persistence/DrizzleAccounts'
import { DrizzleChromeProgressReader } from '#account/infrastructure/persistence/DrizzleChromeProgressReader'
import { DrizzleSessions } from '#account/infrastructure/persistence/DrizzleSessions'
import { SmtpMailer } from '#account/infrastructure/smtp/SmtpMailer'
import { Argon2PasswordHasher } from '#account/infrastructure/system/Argon2PasswordHasher'
import { CryptoSessionTokens } from '#account/infrastructure/system/CryptoSessionTokens'
import { JsonTownCatalog } from '#content/infrastructure/json/JsonTownCatalog'
import { readJsonLessonLibrary } from '#content/infrastructure/json/readJsonLessonLibrary'
import { DrizzleCardRepository } from '#learning/infrastructure/persistence/DrizzleCardRepository'
import { connectPostgres } from '#platform/infrastructure/persistence/connectPostgres'
import { DrizzleUnitOfWork } from '#platform/infrastructure/persistence/DrizzleUnitOfWork'
import { CryptoIdGenerator } from '#platform/infrastructure/system/CryptoIdGenerator'
import { CryptoRandomSource } from '#platform/infrastructure/system/CryptoRandomSource'
import { SystemClock } from '#platform/infrastructure/system/SystemClock'
import { VercelAfterResponse } from '#platform/infrastructure/vercel/VercelAfterResponse'
import { DrizzleReportClosings } from '#report/infrastructure/persistence/DrizzleReportClosings'
import { DrizzleCleanUpRepository } from '#town/infrastructure/persistence/DrizzleCleanUpRepository'
import { DrizzleRegionMapReader } from '#town/infrastructure/persistence/DrizzleRegionMapReader'
import { DrizzleSeenTowns } from '#town/infrastructure/persistence/DrizzleSeenTowns'
import { DrizzleTownNews } from '#town/infrastructure/persistence/DrizzleTownNews'
import { DrizzleTownReader } from '#town/infrastructure/persistence/DrizzleTownReader'
import { DrizzleTownRepository } from '#town/infrastructure/persistence/DrizzleTownRepository'
import { createApp } from './app'
import { type ComposedStores, composeStores } from './composeStores'

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
  readonly mailCopy: MailCopy
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
    mailCopy: new CatalogMailCopy(),
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
  readonly towns: ReadOnlyTowns
  readonly townsWithSchool: TownReader
  readonly seenTowns: SeenTowns
  readonly townNews: TownNewsReader
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly cards: CardReader
  readonly accounts: Accounts
  readonly sessions: Sessions
  readonly chromeProgress: ChromeProgressReader
  readonly reportClosings: ReportClosings
  readonly passwords: PasswordHasher
  readonly sessionTokens: SessionTokens
  readonly unitOfWork: UnitOfWork<ComposedStores>
  readonly isSessionCookieSecure: boolean
  readonly failureSink: FailureSink
  readonly afterResponse: AfterResponse & AfterResponseDrain
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
  const lessons = readJsonLessonLibrary(contentDirectory)
  const dependencies = {
    lessons,
    townCatalog: JsonTownCatalog.fromDirectory(join(contentDirectory, 'town')),
    memoryTerms: defaultMemoryTerms,
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    random: new CryptoRandomSource(),
    accounts: new DrizzleAccounts(database),
    sessions: new DrizzleSessions(database),
    chromeProgress: new DrizzleChromeProgressReader(database),
    reportClosings: new DrizzleReportClosings(database),
    passwords: new Argon2PasswordHasher(),
    sessionTokens: new CryptoSessionTokens(),
    unitOfWork: new DrizzleUnitOfWork(database, composeStores),
    towns: new DrizzleTownRepository(database, 'lockFree'),
    townsWithSchool: new DrizzleTownReader(database),
    seenTowns: new DrizzleSeenTowns(database),
    townNews: new DrizzleTownNews(database),
    regionMap: new DrizzleRegionMapReader(database),
    cleanUps: new DrizzleCleanUpRepository(database),
    cards: new DrizzleCardRepository(database),
    isSessionCookieSecure,
    failureSink: standardErrorSink,
    afterResponse: new VercelAfterResponse(waitUntil, standardErrorSink),
    ...mail,
  }
  return {
    ...dependencies,
    fetch: createApp(dependencies).fetch,
    close,
  }
}

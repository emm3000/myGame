import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type DomainError,
  enqueueBuilding,
  err,
  type Fief,
  type FiefRepository,
  foundFief,
  Instant,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import type { AccountToken } from './auth/AccountTokens'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

const unusedDatabaseUrl = 'postgres://composer@localhost:5432/unused'

const composableEnvironment: NodeJS.ProcessEnv = {
  API_PORT: '3106',
  DATABASE_URL: unusedDatabaseUrl,
  ...mailEnvironment,
}

const environmentWithout = (name: string): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(composableEnvironment).filter(([key]) => key !== name))

const oneLevel = (effect: object): object => ({
  level: 1,
  cost: { wood: 10, stone: 5, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy: 1,
  effect,
})

const oneArtLevel = {
  level: 1,
  cost: { wood: 10, stone: 5, iron: 5, gold: 5, food: 0 },
  durationSeconds: 60,
  requiredLibraryLevel: 1,
  effect: { ratePercent: 5 },
}

const minimalContentFiles: Readonly<Record<string, object>> = {
  'arts/smithing.json': { art: 'smithing', resource: 'iron', levels: [oneArtLevel] },
  'arts/masonry.json': { art: 'masonry', resource: 'stone', levels: [oneArtLevel] },
  'sawmill.json': { building: 'sawmill', levels: [oneLevel({ ratePerHour: 30 })] },
  'quarry.json': { building: 'quarry', levels: [oneLevel({ ratePerHour: 20 })] },
  'iron-mine.json': { building: 'ironMine', levels: [oneLevel({ ratePerHour: 10 })] },
  'farm.json': { building: 'farm', levels: [oneLevel({ ratePerHour: 25, peasantSupply: 5 })] },
  'warehouse.json': { building: 'warehouse', levels: [oneLevel({ capacity: 1500 })] },
  'library.json': {
    building: 'library',
    levels: [
      {
        level: 1,
        cost: { wood: 10, stone: 5, iron: 0, gold: 0, food: 0 },
        durationSeconds: 60,
        peasantOccupancy: 1,
      },
    ],
  },
  'barracks.json': {
    building: 'barracks',
    levels: [
      {
        level: 1,
        cost: { wood: 10, stone: 5, iron: 0, gold: 0, food: 0 },
        durationSeconds: 60,
        peasantOccupancy: 1,
      },
    ],
  },
  'fief.json': {
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    startingCapacity: 1000,
    basePeasantSupply: 10,
    plotsPerProvince: 15,
    baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
    terrainBonus: {
      lowlands: { resource: 'food', ratePerHour: 5 },
      uplands: { resource: 'stone', ratePerHour: 4 },
      ridges: { resource: 'iron', ratePerHour: 2 },
    },
    buildQueueCap: 4,
    seasons: {
      epoch: '2026-10-05T00:00:00Z',
      daysPerSeason: 7,
      multiplierPercent: {
        spring: { wood: 100, stone: 100, iron: 100, gold: 100, food: 125 },
        summer: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
        autumn: { wood: 100, stone: 100, iron: 100, gold: 125, food: 100 },
        winter: { wood: 100, stone: 100, iron: 100, gold: 100, food: 75 },
      },
      durationPercent: {
        spring: { build: 100, study: 100 },
        summer: { build: 75, study: 100 },
        autumn: { build: 100, study: 100 },
        winter: { build: 100, study: 75 },
      },
    },
    units: {
      infantry: {
        cost: { wood: 20, stone: 0, iron: 10, gold: 0, food: 30 },
        durationSeconds: 90,
        peasantOccupancy: 1,
      },
    },
  },
}

const temporaryDirectory = (): string => mkdtempSync(join(tmpdir(), 'mygame-content-'))

const minimalContentDirectory = (): string => {
  const directory = temporaryDirectory()
  mkdirSync(join(directory, 'arts'))
  for (const [file, content] of Object.entries(minimalContentFiles)) {
    writeFileSync(join(directory, file), JSON.stringify(content))
  }
  return directory
}

const contentCopyWithTruncatedSawmill = (): string => {
  const directory = temporaryDirectory()
  cpSync(contentDirectory, directory, { recursive: true })
  const sawmill = readFileSync(join(directory, 'sawmill.json'), 'utf8')
  writeFileSync(join(directory, 'sawmill.json'), sawmill.slice(0, sawmill.length / 2))
  return directory
}

const removeDirectory = (directory: string): void => {
  rmSync(directory, { recursive: true, force: true })
}

describe('composeServer', () => {
  let fixtureDirectory = ''

  beforeAll(() => {
    fixtureDirectory = minimalContentDirectory()
  })

  afterAll(() => {
    removeDirectory(fixtureDirectory)
  })

  it('listens on the port API_PORT names', async () => {
    const server = composeServer(composableEnvironment, fixtureDirectory)

    expect(server.port).toBe(3106)
    await server.close()
  })

  it('builds a catalog from the content folder at start-up', async () => {
    const server = composeServer(composableEnvironment, contentDirectory)

    expect(server.buildingCatalog.levelOf('sawmill', 1)).toEqual({
      building: 'sawmill',
      level: 1,
      cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
      durationSeconds: 120,
      peasantOccupancy: 1,
      ratePerHour: 30,
    })
    await server.close()
  })

  it('reads the new fief settings from the content folder at start-up', async () => {
    const server = composeServer(composableEnvironment, contentDirectory)

    expect(server.buildingCatalog.fiefSettings().startingStocks).toEqual({
      wood: 500,
      stone: 500,
      iron: 200,
      gold: 50,
      food: 300,
    })
    await server.close()
  })

  it('fails start-up on a malformed content file', () => {
    const malformedDirectory = contentCopyWithTruncatedSawmill()

    try {
      expect(() => composeServer(composableEnvironment, malformedDirectory)).toThrow('sawmill.json')
    } finally {
      removeDirectory(malformedDirectory)
    }
  })

  it('refuses to compose without API_PORT', () => {
    expect(() => composeServer(environmentWithout('API_PORT'), fixtureDirectory)).toThrow(
      'API_PORT',
    )
  })

  it('refuses to compose with a non-integer API_PORT', () => {
    expect(() =>
      composeServer({ ...composableEnvironment, API_PORT: '31.5' }, fixtureDirectory),
    ).toThrow('API_PORT')
  })

  it('refuses to compose with a non-positive API_PORT', () => {
    expect(() =>
      composeServer({ ...composableEnvironment, API_PORT: '0' }, fixtureDirectory),
    ).toThrow('API_PORT')
  })

  it('refuses to compose without DATABASE_URL', () => {
    expect(() => composeServer(environmentWithout('DATABASE_URL'), fixtureDirectory)).toThrow(
      'DATABASE_URL',
    )
  })

  it('marks the session cookie Secure unless SESSION_COOKIE_SECURE is false', async () => {
    const server = composeServer(composableEnvironment, fixtureDirectory)

    expect(server.isSessionCookieSecure).toBe(true)
    await server.close()
  })

  it('drops the Secure flag when SESSION_COOKIE_SECURE is false', async () => {
    const server = composeServer(
      { ...composableEnvironment, SESSION_COOKIE_SECURE: 'false' },
      fixtureDirectory,
    )

    expect(server.isSessionCookieSecure).toBe(false)
    await server.close()
  })

  it('refuses to compose with a SESSION_COOKIE_SECURE other than true or false', () => {
    expect(() =>
      composeServer({ ...composableEnvironment, SESSION_COOKIE_SECURE: 'yes' }, fixtureDirectory),
    ).toThrow('SESSION_COOKIE_SECURE')
  })

  it('refuses to compose with an API_PORT above 65535', () => {
    expect(() =>
      composeServer({ ...composableEnvironment, API_PORT: '65536' }, fixtureDirectory),
    ).toThrow('API_PORT')
  })

  it('refuses to compose without SMTP_URL', () => {
    expect(() => composeServer(environmentWithout('SMTP_URL'), fixtureDirectory)).toThrow(
      'SMTP_URL',
    )
  })

  it('refuses an SMTP_URL that is not smtp or smtps', () => {
    expect(() =>
      composeServer(
        { ...composableEnvironment, SMTP_URL: 'http://127.0.0.1:1025' },
        fixtureDirectory,
      ),
    ).toThrow('SMTP_URL')
  })

  it('refuses to compose without MAIL_FROM', () => {
    expect(() => composeServer(environmentWithout('MAIL_FROM'), fixtureDirectory)).toThrow(
      'MAIL_FROM',
    )
  })

  it('refuses to compose without WEB_URL', () => {
    expect(() => composeServer(environmentWithout('WEB_URL'), fixtureDirectory)).toThrow('WEB_URL')
  })

  it('refuses a WEB_URL that is not http or https', () => {
    expect(() =>
      composeServer(
        { ...composableEnvironment, WEB_URL: 'ftp://localhost:3259' },
        fixtureDirectory,
      ),
    ).toThrow('WEB_URL')
  })

  it('exposes the web origin WEB_URL names', async () => {
    const server = composeServer(
      { ...composableEnvironment, WEB_URL: 'https://mygame.example' },
      fixtureDirectory,
    )

    expect(server.webUrl).toBe('https://mygame.example')
    await server.close()
  })

  it('drops the trailing slash of WEB_URL so a link never doubles it', async () => {
    const server = composeServer(
      { ...composableEnvironment, WEB_URL: 'https://mygame.example/' },
      fixtureDirectory,
    )

    expect(server.webUrl).toBe('https://mygame.example')
    await server.close()
  })

  it('answers failed from an unreachable SMTP_URL', async () => {
    const server = composeServer(composableEnvironment, fixtureDirectory)

    const delivery = await server.mailer.send({
      to: 'aldonza@example.com',
      subject: 'Confirma tu correo',
      text: 'Sigue este enlace.',
    })

    expect(delivery).toBe('failed')
    await server.close()
  })
})

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z'))
const frozenClock = { now: (): Instant => foundedAt }
const ana: PlayerId = '00000000-0000-4000-8000-000000000001'

const foundAnasFief = async (server: ComposedServer): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(
      'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders',
    )
    await client.query(
      "INSERT INTO players (id, email, password_hash, created_at) VALUES ($1, 'ana@example.com', 'argon2id-hash', $2)",
      [ana, new Date('2026-09-22T08:00:00Z')],
    )
  } finally {
    await client.end()
  }
  await server.inTransaction(({ fiefs }) =>
    foundFief(
      { playerId: ana, name: 'Valdehierro' },
      { fiefs, catalog: server.buildingCatalog, clock: frozenClock, ids: server.ids },
    ),
  )
}

type Outcome = 'enqueued' | DomainError['kind']

const outcomeOf = (enqueued: Result<unknown, DomainError>): Outcome =>
  enqueued.ok ? 'enqueued' : enqueued.error.kind

const enqueueSawmill = (
  fiefs: FiefRepository,
  server: ComposedServer,
): Promise<Result<Fief, DomainError>> =>
  enqueueBuilding(
    { playerId: ana, building: 'sawmill' },
    { fiefs, catalog: server.buildingCatalog, clock: frozenClock },
  )

const withRead = (
  fiefs: FiefRepository,
  read: (playerId: PlayerId) => Promise<Result<Fief | undefined, DomainError>>,
): FiefRepository => ({
  occupiedPlots: () => fiefs.occupiedPlots(),
  holdsFief: (playerId) => fiefs.holdsFief(playerId),
  fiefOf: read,
  save: (fief) => fiefs.save(fief),
})

const probeLimit = 500

const isLockedFiefReadWaiting = async (observer: Client): Promise<boolean> => {
  const probe = await observer.query<{ waiting: boolean }>(
    `SELECT pg_sleep(0.01), EXISTS (
       SELECT 1 FROM pg_stat_activity
       WHERE datname = current_database()
         AND pid <> pg_backend_pid()
         AND wait_event_type = 'Lock'
         AND query ILIKE 'select "fiefs"."id", %'
     ) AS waiting`,
  )
  return probe.rows[0]?.waiting === true
}

const untilBlockedOrRead = async (secondRead: Promise<unknown>): Promise<void> => {
  let hasRead = false
  void secondRead.then(() => {
    hasRead = true
  })
  const observer = new Client({ connectionString: databaseUrl() })
  await observer.connect()
  try {
    for (let probes = 0; probes < probeLimit; probes += 1) {
      if (hasRead || (await isLockedFiefReadWaiting(observer))) {
        return
      }
    }
    throw new Error(`The second read neither waited on the fief lock nor finished`)
  } finally {
    await observer.end()
  }
}

const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const raceTwoEnqueues = async (server: ComposedServer): Promise<ReadonlyArray<Outcome>> => {
  const firstHasRead = signal()
  const secondHasRead = signal()
  const secondIsBlockedOrHasRead = untilBlockedOrRead(secondHasRead.promise)
  const first = server.inTransaction(({ fiefs }) =>
    enqueueSawmill(
      withRead(fiefs, async (playerId) => {
        const read = await fiefs.fiefOf(playerId)
        firstHasRead.resolve()
        await secondIsBlockedOrHasRead
        return read
      }),
      server,
    ),
  )
  await firstHasRead.promise
  const second = server.inTransaction(({ fiefs }) =>
    enqueueSawmill(
      withRead(fiefs, async (playerId) => {
        const read = await fiefs.fiefOf(playerId)
        secondHasRead.resolve()
        return read
      }),
      server,
    ),
  )
  return Promise.all([first.then(outcomeOf), second.then(outcomeOf)])
}

describe('a fief transaction from the composed server', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3190', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  it('queues the second of two concurrent enqueues behind the first', async () => {
    await foundAnasFief(server)

    const outcomes = await raceTwoEnqueues(server)

    expect(outcomes).toEqual(['enqueued', 'enqueued'])
    const stored = await server.inTransaction(({ fiefs }) => fiefs.fiefOf(ana))
    assert(stored.ok)
    expect(stored.value?.slot).toMatchObject({ kind: 'busy', building: 'sawmill', targetLevel: 1 })
    expect(stored.value?.buildQueue).toMatchObject([{ building: 'sawmill', targetLevel: 2 }])
  })

  it('debits both costs when two enqueues race', async () => {
    await foundAnasFief(server)

    await raceTwoEnqueues(server)

    const stored = await server.inTransaction(({ fiefs }) => fiefs.fiefOf(ana))
    expect(stored.ok && stored.value?.stocks).toEqual({
      wood: 350,
      stone: 462,
      iron: 200,
      gold: 50,
      food: 300,
    })
  })
})

describe('an account transaction from the composed server', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3190', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  it('forgets a token issued in a refused transaction', async () => {
    await foundAnasFief(server)
    const verifyLink: AccountToken = {
      token: 'refused-verify-link-token',
      playerId: ana,
      kind: 'verify',
      expiresAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-23T08:00:00Z')),
    }

    await server.inTransaction(async ({ accountTokens }) => {
      await accountTokens.issue(verifyLink, foundedAt)
      return err('refused')
    })

    const redeemed = await server.inTransaction(async ({ accountTokens }) =>
      ok(await accountTokens.redeem(verifyLink.token, 'verify', foundedAt)),
    )
    expect(redeemed).toEqual(ok(undefined))
  })
})

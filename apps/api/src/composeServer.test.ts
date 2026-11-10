import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type DomainError,
  err,
  foundTown,
  Instant,
  MemoryCard,
  ok,
  type PlayerId,
  type Result,
  startBuildingWork,
  type Town,
  type TownRepository,
} from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { JsonTownCatalog } from './adapters/json/JsonTownCatalog'
import type { AccountToken } from './auth/AccountTokens'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'
import { isWaitingOnALock, lockProbeLimit } from './lockWaitProbe.testSupport'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

const unusedDatabaseUrl = 'postgres://composer@localhost:5432/unused'

const composableEnvironment: NodeJS.ProcessEnv = {
  DATABASE_URL: unusedDatabaseUrl,
  ...mailEnvironment,
}

const environmentWithout = (name: string): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(composableEnvironment).filter(([key]) => key !== name))

const temporaryDirectory = (): string => mkdtempSync(join(tmpdir(), 'mygame-content-'))

const minimalContentDirectory = (): string => {
  const directory = temporaryDirectory()
  cpSync(join(contentDirectory, 'lessons'), join(directory, 'lessons'), { recursive: true })
  cpSync(join(contentDirectory, 'town'), join(directory, 'town'), { recursive: true })
  return directory
}

const contentCopyWithTruncatedFarm = (): string => {
  const directory = temporaryDirectory()
  cpSync(contentDirectory, directory, { recursive: true })
  const farmFile = join(directory, 'town', 'farm.json')
  const farm = readFileSync(farmFile, 'utf8')
  writeFileSync(farmFile, farm.slice(0, farm.length / 2))
  return directory
}

const contentCopyWithTruncatedLexicon = (): string => {
  const directory = temporaryDirectory()
  cpSync(contentDirectory, directory, { recursive: true })
  const lexiconFile = join(directory, 'lessons', 'words.json')
  const lexicon = readFileSync(lexiconFile, 'utf8')
  writeFileSync(lexiconFile, lexicon.slice(0, lexicon.length / 2))
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

  it('fails start-up on a malformed content file', () => {
    const malformedDirectory = contentCopyWithTruncatedFarm()

    try {
      expect(() => composeServer(composableEnvironment, malformedDirectory)).toThrow('farm.json')
    } finally {
      removeDirectory(malformedDirectory)
    }
  })

  it('fails start-up on a malformed lexicon', () => {
    const malformedDirectory = contentCopyWithTruncatedLexicon()

    try {
      expect(() => composeServer(composableEnvironment, malformedDirectory)).toThrow('words.json')
    } finally {
      removeDirectory(malformedDirectory)
    }
  })

  it('reads lesson 1 from the content folder at start-up', async () => {
    const server = composeServer(composableEnvironment, fixtureDirectory)

    expect(server.lessons.lessonOf('lesson-1')?.words).toHaveLength(5)
    await server.close()
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

const registerAna = async (): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, earned_skills, band_starts, held_out_words, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    await client.query(
      "INSERT INTO players (id, email, password_hash, created_at, report_read_at) VALUES ($1, 'ana@example.com', 'argon2id-hash', $2, $2)",
      [ana, new Date('2026-09-22T08:00:00Z')],
    )
  } finally {
    await client.end()
  }
}

type Outcome = 'enqueued' | DomainError['kind']

const outcomeOf = (enqueued: Result<unknown, DomainError>): Outcome =>
  enqueued.ok ? 'enqueued' : enqueued.error.kind

const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const townCatalog = JsonTownCatalog.fromDirectory(join(contentDirectory, 'town'))

const lockedTownReadQuery = 'select "id", "player_id", "region", %'

const foundAnasTown = async (server: ComposedServer): Promise<void> => {
  await registerAna()
  const founded = await server.inTransaction(({ towns, earnedSkills }) =>
    foundTown(
      { playerId: ana, name: 'Maple Falls' },
      { towns, skills: earnedSkills, catalog: townCatalog, clock: frozenClock, ids: server.ids },
    ),
  )
  assert(founded.ok)
}

const pausingTownRead = (
  towns: TownRepository,
  afterRead: () => Promise<void>,
): TownRepository => ({
  holdsTown: (playerId) => towns.holdsTown(playerId),
  occupiedSites: () => towns.occupiedSites(),
  save: (town) => towns.save(town),
  townOf: async (playerId) => {
    const read = await towns.townOf(playerId)
    await afterRead()
    return read
  },
})

const untilTownBlockedOrRead = async (secondRead: Promise<unknown>): Promise<void> => {
  let hasRead = false
  void secondRead.then(() => {
    hasRead = true
  })
  const observer = new Client({ connectionString: databaseUrl() })
  await observer.connect()
  try {
    for (let probes = 0; probes < lockProbeLimit; probes += 1) {
      if (hasRead || (await isWaitingOnALock(observer, [lockedTownReadQuery]))) {
        return
      }
    }
    throw new Error('The second read neither waited on the town lock nor finished')
  } finally {
    await observer.end()
  }
}

const startFarmWork = (
  server: ComposedServer,
  afterRead: () => Promise<void>,
): Promise<Result<Town, DomainError>> =>
  server.inTransaction(({ towns, townNews }) =>
    startBuildingWork(
      { playerId: ana, building: 'farm' },
      {
        towns: pausingTownRead(towns, afterRead),
        news: townNews,
        catalog: townCatalog,
        clock: frozenClock,
      },
    ),
  )

const raceTwoStarts = async (server: ComposedServer): Promise<ReadonlyArray<Outcome>> => {
  const firstHasRead = signal()
  const secondHasRead = signal()
  const secondIsBlockedOrHasRead = untilTownBlockedOrRead(secondHasRead.promise)
  const first = startFarmWork(server, async () => {
    firstHasRead.resolve()
    await secondIsBlockedOrHasRead
  })
  await firstHasRead.promise
  const second = startFarmWork(server, async () => {
    secondHasRead.resolve()
  })
  return Promise.all([first.then(outcomeOf), second.then(outcomeOf)])
}

describe('a town transaction from the composed server', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('queues the second of two concurrent starts on one town behind the first', async () => {
    await foundAnasTown(server)

    const outcomes = await raceTwoStarts(server)

    const stored = await server.inTransaction(({ towns }) => towns.townOf(ana))
    assert(stored.ok && stored.value !== undefined)
    expect([
      outcomes,
      stored.value.workSlot,
      stored.value.waitingList.map(({ building, level }) => ({ building, level })),
    ]).toEqual([
      ['enqueued', 'enqueued'],
      expect.objectContaining({ kind: 'busy', building: 'farm', level: 1 }),
      [{ building: 'farm', level: 2 }],
    ])
  })

  it('debits both costs when two starts on one town race', async () => {
    await foundAnasTown(server)

    await raceTwoStarts(server)

    const stored = await server.inTransaction(({ towns }) => towns.townOf(ana))
    expect(stored.ok && stored.value?.stocks).toEqual({
      money: 275,
      food: 300,
      power: 200,
      material: 325,
    })
  })
})

describe('an account transaction from the composed server', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('forgets a token issued in a refused transaction', async () => {
    await registerAna()
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

describe('a review transaction from the composed server', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('forgets the card and the pending review a refused transaction wrote', async () => {
    await registerAna()

    await server.inTransaction(async ({ cards, pendingReviews }) => {
      await cards.save(ana, { wordId: 'school', card: MemoryCard.entered(foundedAt) })
      await pendingReviews.save(ana, 'school', { hintShown: true, nearMissAnswer: null })
      return err('refused')
    })

    const kept = await server.inTransaction(async ({ cards, pendingReviews }) =>
      ok({
        cards: await cards.cardsOf(ana),
        pending: await pendingReviews.pendingReviewOf(ana, 'school'),
      }),
    )
    expect(kept).toEqual(ok({ cards: ok([]), pending: undefined }))
  })
})

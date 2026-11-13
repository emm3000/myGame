import { fileURLToPath } from 'node:url'
import { type HoldoutChecks, HoldoutChecksSchema } from '@mygame/contracts'
import { type BandStartRepository, type Clock, Instant, type RandomSource } from '@mygame/domain'
import { Client, type QueryResultRow } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'
import {
  isWaitingOnALock,
  lockedPlayerReadQuery,
  lockProbeLimit,
} from '../lockWaitProbe.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const MILLISECONDS_PER_WEEK = 7 * 24 * 3_600_000

const bandStartedAt = Date.parse('2026-11-12T09:00:00.000Z')

const weeksAfterStart = (weeks: number): Instant =>
  Instant.fromEpochMilliseconds(bandStartedAt + weeks * MILLISECONDS_PER_WEEK)

const everyTenthFirst: RandomSource = {
  sampleOf: (items, count) =>
    [
      ...items.filter((_, index) => index % 10 === 9),
      ...items.filter((_, index) => index % 10 !== 9),
    ].slice(0, count),
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const storedRows = async <Row extends QueryResultRow>(
  statement: string,
): Promise<ReadonlyArray<Row>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    return (await client.query<Row>(statement)).rows
  } finally {
    await client.end()
  }
}

const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const pausingFirstStartsRead = (
  bandStarts: BandStartRepository,
  afterRead: () => Promise<void>,
): BandStartRepository => {
  let hasRead = false
  return {
    save: (playerId, start) => bandStarts.save(playerId, start),
    saveCheck: (playerId, band, check) => bandStarts.saveCheck(playerId, band, check),
    bandStartsOf: async (playerId) => {
      const read = await bandStarts.bandStartsOf(playerId)
      if (!hasRead) {
        hasRead = true
        await afterRead()
      }
      return read
    },
  }
}

const pausingFirstTransaction = (
  inTransaction: Transaction,
  afterFirstStartsRead: () => Promise<void>,
): Transaction => {
  let transactions = 0
  return (work) => {
    transactions += 1
    const isFirst = transactions === 1
    return inTransaction((stores) =>
      work(
        isFirst
          ? {
              ...stores,
              bandStarts: pausingFirstStartsRead(stores.bandStarts, afterFirstStartsRead),
            }
          : stores,
      ),
    )
  }
}

const untilPlayerBlockedOrAnswered = async (secondAnswer: Promise<unknown>): Promise<void> => {
  let hasAnswered = false
  void secondAnswer.then(() => {
    hasAnswered = true
  })
  const observer = new Client({ connectionString: databaseUrl() })
  await observer.connect()
  try {
    for (let probes = 0; probes < lockProbeLimit; probes += 1) {
      if (hasAnswered || (await isWaitingOnALock(observer, [lockedPlayerReadQuery]))) {
        return
      }
    }
    throw new Error('The second answer neither waited on the player lock nor finished')
  } finally {
    await observer.end()
  }
}

type Player = { readonly cookie: string }

type AskingCheck = Extract<HoldoutChecks['checks'][number], { readonly kind: 'asking' }>

describe('the holdout check routes', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>
  let now = weeksAfterStart(0)
  const clock: Clock = { now: () => now }

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await storedRows(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    now = weeksAfterStart(0)
    app = createApp({ ...server, clock, random: everyTenthFirst })
  })

  const send = async (
    player: Player,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> =>
    await app.request(path, {
      method,
      headers: {
        cookie: player.cookie,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })

  const checksOf = async (response: Response): Promise<HoldoutChecks['checks']> => {
    expect(response.status).toBe(200)
    return HoldoutChecksSchema.parse(await response.json()).checks
  }

  const wordIdOf = (lemma: string): string =>
    server.lessons
      .lessonOf('lesson-22')
      ?.words.find(({ acceptedForms }) => acceptedForms[0] === lemma)?.id ?? 'missing'

  const glossOf = (wordId: string): string =>
    server.lessons.placementWordsOf(1).find(({ id }) => id === wordId)?.gloss ?? ''

  const studiedBandOne = async (): Promise<Player> => {
    const signedUp = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', password: 'hierro-y-lana', scaffold: 'es' }),
    })
    const [cookie = ''] = (signedUp.headers.get('set-cookie') ?? '').split(';')
    const player = { cookie }
    expect((await send(player, 'POST', '/town', { name: 'Maple Falls' })).status).toBe(200)
    expect((await send(player, 'POST', '/town/lessons', { lessonId: 'lesson-22' })).status).toBe(
      200,
    )
    now = weeksAfterStart(1)
    expect((await send(player, 'GET', '/town')).status).toBe(200)
    return player
  }

  const signedInAt = async (week: number): Promise<Player> => {
    now = weeksAfterStart(week)
    const signedIn = await app.request('/auth/sign-in', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', password: 'hierro-y-lana' }),
    })
    expect(signedIn.status).toBe(200)
    const [cookie = ''] = (signedIn.headers.get('set-cookie') ?? '').split(';')
    return { cookie }
  }

  const begunAt = async (week: number): Promise<AskingCheck> => {
    const player = await signedInAt(week)
    const [asking] = await checksOf(await send(player, 'POST', `/holdout-checks/1/${week}`))
    assert(asking?.kind === 'asking')
    return asking
  }

  const allRight = ({ items }: AskingCheck) =>
    items.map(({ wordId, choices }) => ({
      wordId,
      choiceId: choices.find(({ gloss }) => gloss === glossOf(wordId))?.choiceId ?? '',
    }))

  it('answers no check before 8 weeks have passed since the band’s start', async () => {
    const player = await studiedBandOne()

    expect(await checksOf(await send(player, 'GET', '/holdout-checks'))).toEqual([])
  })

  it('falls due on read 8 weeks after the band’s start', async () => {
    await studiedBandOne()
    const player = await signedInAt(8)

    expect(await checksOf(await send(player, 'GET', '/holdout-checks'))).toEqual([
      { kind: 'due', band: 1, week: 8 },
    ])
  })

  it('reads the checks without writing', async () => {
    const studying = await studiedBandOne()
    expect((await send(studying, 'POST', '/town/lessons', { lessonId: 'lesson-17' })).status).toBe(
      200,
    )
    const player = await signedInAt(8)

    await send(player, 'GET', '/holdout-checks')

    expect(await storedRows('SELECT lesson_id FROM town_lesson_slots')).toEqual([
      { lesson_id: 'lesson-17' },
    ])
  })

  it('asks the held-out words of the studied lesson beside as many practised ones', async () => {
    await studiedBandOne()

    await begunAt(8)

    const stored = await storedRows<{ word_id: string; is_held_out: boolean }>(
      'SELECT word_id, is_held_out FROM holdout_check_words ORDER BY word_id',
    )
    expect(stored.filter(({ is_held_out }) => is_held_out).map(({ word_id }) => word_id)).toEqual(
      [wordIdOf('problem'), wordIdOf('see')].sort(),
    )
    expect(stored.filter(({ is_held_out }) => !is_held_out)).toHaveLength(2)
  })

  it('begins a check over fewer practised words than held-out ones', async () => {
    const mostlyHeldOut = ['see', 'find', 'change', 'problem']
    app = createApp({
      ...server,
      clock,
      random: {
        sampleOf: (items, count) =>
          items.some((item) => item === 'see')
            ? [
                ...items.filter((item) => mostlyHeldOut.some((headword) => headword === item)),
                ...items.filter(
                  (item) => ![...mostlyHeldOut, 'right'].some((word) => word === item),
                ),
              ].slice(0, count)
            : server.random.sampleOf(items, count),
      },
    })
    await studiedBandOne()

    const asking = await begunAt(8)

    expect(asking.items).toHaveLength(5)
  })

  const definitionOf = (wordId: string): string =>
    server.lessons.placementWordsOf(1).find(({ id }) => id === wordId)?.definition ?? ''

  it('asks a check under none with the definitions as the choices', async () => {
    const studying = await studiedBandOne()
    expect((await send(studying, 'PUT', '/player/scaffold', { scaffold: 'none' })).status).toBe(200)

    const { items } = await begunAt(8)

    expect(
      items.every(({ wordId, choices }) =>
        choices.some(({ gloss }) => gloss === definitionOf(wordId)),
      ),
    ).toBe(true)
  })

  it('reads a check begun under es with the definitions as the choices once under none', async () => {
    await studiedBandOne()
    await begunAt(8)
    const player = await signedInAt(8)
    expect((await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })).status).toBe(200)

    const [asking] = await checksOf(await send(player, 'GET', '/holdout-checks'))

    assert(asking?.kind === 'asking')
    expect(
      asking.items.every(({ wordId, choices }) =>
        choices.some(({ gloss }) => gloss === definitionOf(wordId)),
      ),
    ).toBe(true)
  })

  it('stores the scores of a check taken', async () => {
    await studiedBandOne()
    const asking = await begunAt(8)
    const player = await signedInAt(8)

    const checks = await checksOf(
      await send(player, 'POST', '/holdout-checks/1/8/answers', { answers: allRight(asking) }),
    )

    expect(checks).toEqual([])
    expect(
      await storedRows('SELECT week, kind, held_out_score, practised_score FROM holdout_checks'),
    ).toEqual([{ week: 8, kind: 'taken', held_out_score: 2, practised_score: 2 }])
  })

  it('serializes two concurrent answers to one check of a player with no town', async () => {
    await studiedBandOne()
    const asking = await begunAt(8)
    const player = await signedInAt(8)
    await storedRows('DELETE FROM towns')
    const firstHasRead = signal()
    const secondHasAnswered = signal()
    const secondIsBlockedOrHasAnswered = untilPlayerBlockedOrAnswered(secondHasAnswered.promise)
    const racingApp = createApp({
      ...server,
      clock,
      random: everyTenthFirst,
      inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
        firstHasRead.resolve()
        await secondIsBlockedOrHasAnswered
      }),
    })
    const answerRight = (): Promise<Response> =>
      Promise.resolve(
        racingApp.request('/holdout-checks/1/8/answers', {
          method: 'POST',
          headers: { cookie: player.cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ answers: allRight(asking) }),
        }),
      )

    const first = answerRight()
    await firstHasRead.promise
    const second = answerRight().then((response) => {
      secondHasAnswered.resolve()
      return response
    })
    const statuses = (await Promise.all([first, second])).map(({ status }) => status)

    expect(statuses).toEqual([200, 409])
  })

  it('refuses to begin a check not due yet', async () => {
    await studiedBandOne()
    const player = await signedInAt(7)

    expect((await send(player, 'POST', '/holdout-checks/1/8')).status).toBe(409)
  })

  it('refuses a week with no check', async () => {
    await studiedBandOne()
    const player = await signedInAt(9)

    expect((await send(player, 'POST', '/holdout-checks/1/9')).status).toBe(400)
  })

  it('holds the released lesson back until the 24-week check closes', async () => {
    await studiedBandOne()
    const player = await signedInAt(24)

    const started = await send(player, 'POST', '/town/lessons', { lessonId: 'released-1-1' })

    expect(started.status).toBe(404)
  })

  it('releases the held-out words through the lesson slot after the 24-week check is skipped', async () => {
    await studiedBandOne()
    const player = await signedInAt(24)
    expect(await checksOf(await send(player, 'POST', '/holdout-checks/1/24/skip'))).toEqual([])

    expect((await send(player, 'POST', '/town/lessons', { lessonId: 'released-1-1' })).status).toBe(
      200,
    )
    expect((await send(await signedInAt(25), 'GET', '/town')).status).toBe(200)

    const cards = await storedRows<{ word_id: string }>(
      `SELECT word_id FROM cards WHERE word_id IN ('${wordIdOf('see')}', '${wordIdOf('problem')}') ORDER BY word_id`,
    )
    expect(cards.map(({ word_id }) => word_id)).toEqual(
      [wordIdOf('problem'), wordIdOf('see')].sort(),
    )
  })
})

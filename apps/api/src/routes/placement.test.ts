import { fileURLToPath } from 'node:url'
import { type Placement, PlacementSchema } from '@mygame/contracts'
import { type Clock, Instant } from '@mygame/domain'
import { Client, type QueryResultRow } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'
import type { LessonLibrary } from '../learning/LessonLibrary'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const firstSignInAt = '2026-11-12T09:00:00.000Z'

const frozenClock: Clock = { now: () => Instant.fromEpochMilliseconds(Date.parse(firstSignInAt)) }

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

type Player = { readonly cookie: string }

const draftedBandOneOf = (lessons: LessonLibrary): LessonLibrary => ({
  lessonOf: (lessonId) => lessons.lessonOf(lessonId),
  lessonOfWord: (wordId) => lessons.lessonOfWord(wordId),
  isHeadword: (word) => lessons.isHeadword(word),
  bandOfLesson: (lessonId) => lessons.bandOfLesson(lessonId),
  wordsOfBand: (band) => {
    const entered = new Set(lessons.placementWordsOf(band).map(({ headword }) => headword))
    return lessons.wordsOfBand(band).filter(({ headword }) => entered.has(headword))
  },
  hasLessons: (band) => band === 2 || lessons.hasLessons(band),
  placementWordsOf: (band) => lessons.placementWordsOf(band),
  lessons: () => lessons.lessons(),
})

type AskingPlacement = Extract<Placement, { readonly kind: 'asking' }>

describe('the placement routes', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>

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
    app = createApp({ ...server, clock: frozenClock, lessons: draftedBandOneOf(server.lessons) })
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

  const signUp = async (): Promise<Player> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', password: 'hierro-y-lana' }),
    })
    const [cookie = ''] = (response.headers.get('set-cookie') ?? '').split(';')
    return { cookie }
  }

  const placementOf = async (response: Response): Promise<Placement> => {
    expect(response.status).toBe(200)
    return PlacementSchema.parse(await response.json())
  }

  const begun = async (player: Player): Promise<AskingPlacement> => {
    const placement = await placementOf(await send(player, 'POST', '/placement'))
    assert(placement.kind === 'asking')
    return placement
  }

  const glossOf = (wordId: string): string =>
    server.lessons.placementWordsOf(1).find(({ id }) => id === wordId)?.gloss ?? ''

  const answersWithRight = (
    { items }: AskingPlacement,
    rightCount: number,
  ): ReadonlyArray<{ readonly wordId: string; readonly choiceId: string }> =>
    items.map(({ wordId, choices }, index) => {
      const isRight = (gloss: string): boolean => gloss === glossOf(wordId)
      const chosen = choices.find(({ gloss }) =>
        index < rightCount ? isRight(gloss) : !isRight(gloss),
      )
      return { wordId, choiceId: chosen?.choiceId ?? '' }
    })

  const answerBandOne = async (player: Player, rightCount: number): Promise<Response> => {
    const asking = await begun(player)
    return send(player, 'POST', '/placement/answers', {
      band: 1,
      answers: answersWithRight(asking, rightCount),
    })
  }

  it('offers a placement to an account that has not started band 1', async () => {
    const player = await signUp()

    expect(await placementOf(await send(player, 'GET', '/placement'))).toEqual({ kind: 'offered' })
  })

  it('offers no placement while the shipped band 1 is partly drafted', async () => {
    app = createApp({ ...server, clock: frozenClock })
    const player = await signUp()

    expect(await placementOf(await send(player, 'GET', '/placement'))).toEqual({
      kind: 'closed',
      scores: [],
    })
    expect((await send(player, 'POST', '/placement')).status).toBe(409)
  })

  it("asks band 1's 30 sampled words, each with at most 4 choices", async () => {
    const player = await signUp()

    const asking = await begun(player)

    expect(asking.band).toBe(1)
    expect(asking.items.length).toBe(30)
    expect(asking.items.every(({ choices }) => choices.length <= 4)).toBe(true)
  })

  it('stores the sample the api drew', async () => {
    const player = await signUp()

    await begun(player)

    expect(
      await storedRows('SELECT count(*)::int AS count FROM placement_words WHERE band = 1'),
    ).toEqual([{ count: 30 }])
  })

  it('never samples a word a chrome lesson teaches', async () => {
    const player = await signUp()
    const chromeWordIds = server.lessons
      .lessons()
      .slice(0, 16)
      .flatMap(({ words }) => words.map(({ id }) => id))

    const asking = await begun(player)

    expect(asking.items.filter(({ wordId }) => chromeWordIds.includes(wordId))).toEqual([])
  })

  it('refuses a second placement with an empty body', async () => {
    const player = await signUp()
    await begun(player)

    const second = await send(player, 'POST', '/placement')

    expect(second.status).toBe(409)
    expect(await second.text()).toBe('')
  })

  it('passes a band at 29 of 30 and stores its score and instant', async () => {
    const player = await signUp()

    const placement = await placementOf(await answerBandOne(player, 29))

    expect(placement).toEqual({
      kind: 'closed',
      scores: [{ band: 1, score: 29, takenAt: firstSignInAt, isPlacedOut: true }],
    })
    expect(
      await storedRows('SELECT band, score, taken_at AS "takenAt" FROM placement_scores'),
    ).toEqual([{ band: 1, score: 29, takenAt: new Date(firstSignInAt) }])
  })

  it('fails a band at 28 of 30', async () => {
    const player = await signUp()

    const placement = await placementOf(await answerBandOne(player, 28))

    expect(placement).toEqual({
      kind: 'closed',
      scores: [{ band: 1, score: 28, takenAt: firstSignInAt, isPlacedOut: false }],
    })
  })

  it('refuses an answer to a band the check is not asking', async () => {
    const player = await signUp()
    const asking = await begun(player)

    const refused = await send(player, 'POST', '/placement/answers', {
      band: 2,
      answers: answersWithRight(asking, 30),
    })

    expect(refused.status).toBe(409)
  })

  it('refuses answers that leave a word unanswered', async () => {
    const player = await signUp()
    const asking = await begun(player)

    const refused = await send(player, 'POST', '/placement/answers', {
      band: 1,
      answers: answersWithRight(asking, 30).slice(1),
    })

    expect(refused.status).toBe(400)
    expect(await storedRows('SELECT band FROM placement_scores')).toEqual([])
  })

  it('refuses a malformed answer body with an empty body', async () => {
    const player = await signUp()
    await begun(player)

    const refused = await send(player, 'POST', '/placement/answers', { band: 1 })

    expect(refused.status).toBe(400)
    expect(await refused.text()).toBe('')
  })

  it('closes a skipped placement for good', async () => {
    const player = await signUp()

    const skipped = await placementOf(await send(player, 'POST', '/placement/skip'))

    expect(skipped).toEqual({ kind: 'closed', scores: [] })
    expect((await send(player, 'POST', '/placement')).status).toBe(409)
    expect(await placementOf(await send(player, 'GET', '/placement'))).toEqual(skipped)
  })

  it('offers no placement to a player who started band 1', async () => {
    const player = await signUp()
    expect((await send(player, 'POST', '/town', { name: 'Maple Falls' })).status).toBe(200)
    expect((await send(player, 'POST', '/town/lessons', { lessonId: 'lesson-17' })).status).toBe(
      200,
    )

    expect(await placementOf(await send(player, 'GET', '/placement'))).toEqual({
      kind: 'closed',
      scores: [],
    })
    expect((await send(player, 'POST', '/placement')).status).toBe(409)
  })

  it('starts a placed-out lesson without a holdout draw', async () => {
    const player = await signUp()
    await answerBandOne(player, 30)
    expect((await send(player, 'POST', '/town', { name: 'Maple Falls' })).status).toBe(200)

    const started = await send(player, 'POST', '/town/lessons', { lessonId: 'lesson-17' })

    expect(started.status).toBe(200)
    expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
  })
})

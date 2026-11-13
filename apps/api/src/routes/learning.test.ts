import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  type DueReview,
  PlayerSchema,
  ReportSchema,
  type ReviewAnswer,
  ReviewAnswerSchema,
  ReviewHintSchema,
  type Reviews,
  ReviewsSchema,
  type TownOverview,
  TownOverviewSchema,
} from '@mygame/contracts'
import { type CardRepository, type Clock, Instant, type RandomSource } from '@mygame/domain'
import { Client, type QueryResultRow } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { shippedCurriculum } from '../adapters/json/shippedCurriculum.testSupport'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'
import type { LessonLibrary, ShelvedLesson } from '../learning/LessonLibrary'
import {
  isWaitingOnALock,
  lockedPlayerReadQuery,
  lockProbeLimit,
} from '../lockWaitProbe.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

type SettableClock = Clock & { readonly setTo: (iso: string) => void }

const settableClock = (iso: string): SettableClock => {
  let current = Instant.fromEpochMilliseconds(Date.parse(iso))
  return {
    now: () => current,
    setTo: (next) => {
      current = Instant.fromEpochMilliseconds(Date.parse(next))
    },
  }
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

const loggedFramesOf = async (wordId: string): Promise<ReadonlyArray<string | null>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const logged = await client.query<{ shown_frame: string | null }>(
      'SELECT shown_frame FROM review_log WHERE word_id = $1 ORDER BY id',
      [wordId],
    )
    return logged.rows.map((row) => row.shown_frame)
  } finally {
    await client.end()
  }
}

const pendingFramesOf = async (wordId: string): Promise<ReadonlyArray<string | null>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const pending = await client.query<{ shown_frame: string | null }>(
      'SELECT shown_frame FROM pending_reviews WHERE word_id = $1',
      [wordId],
    )
    return pending.rows.map((row) => row.shown_frame)
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

const pausingFirstCardRead = (
  cards: CardRepository,
  afterRead: () => Promise<void>,
): CardRepository => {
  let hasRead = false
  return {
    save: (playerId, held) => cards.save(playerId, held),
    cardsOf: async (playerId) => {
      const read = await cards.cardsOf(playerId)
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
  afterFirstCardRead: () => Promise<void>,
): Transaction => {
  let transactions = 0
  return (work) => {
    transactions += 1
    const isFirst = transactions === 1
    return inTransaction((stores) =>
      work(
        isFirst
          ? { ...stores, cards: pausingFirstCardRead(stores.cards, afterFirstCardRead) }
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

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

type Player = {
  readonly cookie: string
}

const lemmas: Readonly<Record<string, string>> = {
  'lesson-1-1': 'home',
  'lesson-1-2': 'school',
  'lesson-1-3': 'work',
  'lesson-1-4': 'money',
  'lesson-1-5': 'food',
}

const wordIds = Object.keys(lemmas)

const lemmaOf = (wordId: string): string => lemmas[wordId] ?? ''

const glosses: Readonly<Record<string, string>> = {
  'lesson-1-1': 'hogar',
  'lesson-1-2': 'escuela',
  'lesson-1-3': 'trabajar',
  'lesson-1-4': 'dinero',
  'lesson-1-5': 'comida',
}

const choiceIdOf = (recognition: DueReview, chosenWordId: string): string => {
  assert(recognition.mode === 'recognition')
  const choice = recognition.choices.find(({ gloss }) => gloss === glosses[chosenWordId])
  assert(choice !== undefined)
  return choice.choiceId
}

const stringsIn = (value: unknown): ReadonlyArray<string> => {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.flatMap(stringsIn)
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(stringsIn)
  }
  return []
}

const lessonStartsAt = '2026-11-10T08:55:00.000Z'

const lessonFinishesAt = '2026-11-10T09:00:00.000Z'

const secondLearningStepAt = '2026-11-10T09:10:00.000Z'

const firstRecallAt = '2026-11-12T09:10:00.000Z'

const lateFirstRecallAt = '2026-11-12T15:00:00.000Z'

const secondRecallAt = '2026-11-23T15:00:00.000Z'

describe('the learning routes', () => {
  let server: ComposedServer
  let clock: SettableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    clock = settableClock('2026-11-10T08:00:00Z')
    app = createApp({ ...server, clock })
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
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
        scaffold: 'es',
      }),
    })
    return { cookie: sessionCookieOf(response) }
  }

  const signUpWithATown = async (): Promise<Player> => {
    const player = await signUp()
    const founded = await send(player, 'POST', '/town', { name: 'Maple Falls' })
    expect(founded.status).toBe(200)
    return player
  }

  const overviewOf = async (response: Response): Promise<TownOverview> => {
    expect(response.status).toBe(200)
    return TownOverviewSchema.parse(await response.json())
  }

  const readTown = async (player: Player): Promise<TownOverview> =>
    overviewOf(await send(player, 'GET', '/town'))

  const readReviews = async (player: Player): Promise<Reviews> => {
    const response = await send(player, 'GET', '/reviews')
    expect(response.status).toBe(200)
    return ReviewsSchema.parse(await response.json())
  }

  const startLesson = (player: Player, lessonId = 'lesson-1'): Promise<Response> =>
    send(player, 'POST', '/town/lessons', { lessonId })

  const stopLesson = (player: Player, lessonId = 'lesson-1'): Promise<Response> =>
    send(player, 'DELETE', `/town/lessons/${lessonId}`)

  const answer = (player: Player, wordId: string, given: string): Promise<Response> =>
    send(player, 'POST', `/reviews/${wordId}/answer`, { answer: given })

  const answered = async (player: Player, wordId: string, given: string): Promise<ReviewAnswer> => {
    const response = await answer(player, wordId, given)
    expect(response.status).toBe(200)
    return ReviewAnswerSchema.parse(await response.json())
  }

  const hint = (player: Player, wordId: string): Promise<Response> =>
    send(player, 'POST', `/reviews/${wordId}/hint`)

  const refusalOf = async (response: Response): Promise<unknown> => ({
    status: response.status,
    body: ApiErrorSchema.parse(await response.json()),
  })

  const studyLessonOne = async (): Promise<Player> => {
    const player = await signUpWithATown()
    clock.setTo(lessonStartsAt)
    expect((await startLesson(player)).status).toBe(200)
    return player
  }

  const answerEvery = async (
    player: Player,
    answerOf: (wordId: string) => string,
  ): Promise<ReadonlyArray<ReviewAnswer>> => {
    const answers: Array<ReviewAnswer> = []
    for (const wordId of wordIds) {
      answers.push(await answered(player, wordId, answerOf(wordId)))
    }
    return answers
  }

  const dueReviewOf = async (player: Player, wordId: string): Promise<DueReview> => {
    const review = (await readReviews(player)).due.find((due) => due.wordId === wordId)
    assert(review !== undefined)
    return review
  }

  const recognizeEvery = async (player: Player): Promise<ReadonlyArray<ReviewAnswer>> => {
    const answers: Array<ReviewAnswer> = []
    for (const review of (await readReviews(player)).due) {
      answers.push(await answered(player, review.wordId, choiceIdOf(review, review.wordId)))
    }
    return answers
  }

  const studyToTheFirstRecall = async (): Promise<Player> => {
    const player = await studyLessonOne()
    clock.setTo(lessonFinishesAt)
    await recognizeEvery(player)
    clock.setTo(secondLearningStepAt)
    await recognizeEvery(player)
    clock.setTo(firstRecallAt)
    return player
  }

  const studyToTheLastSecondRecall = async (): Promise<Player> => {
    const player = await studyToTheFirstRecall()
    clock.setTo(lateFirstRecallAt)
    await answerEvery(player, lemmaOf)
    clock.setTo(secondRecallAt)
    for (const wordId of wordIds.slice(0, 4)) {
      await answered(player, wordId, lemmaOf(wordId))
    }
    return player
  }

  const dueWordsOf = (due: ReadonlyArray<DueReview>): ReadonlyArray<string> =>
    due.map(({ wordId, mode, dueAt }) => `${wordId} ${mode} ${dueAt}`)

  const dueAtsOf = (answers: ReadonlyArray<ReviewAnswer>): ReadonlyArray<string | undefined> =>
    answers.map(({ verdict }) => (verdict.kind === 'nearMiss' ? undefined : verdict.dueAt))

  describe('the school lesson route', () => {
    const lessonOneGlosses = ['hogar', 'escuela', 'trabajar', 'dinero', 'comida']

    it('studies lesson 1 in the school for 300 s at school 1, costing nothing', async () => {
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)
      const before = await readTown(player)

      const overview = await overviewOf(await startLesson(player))

      expect([overview.lessonSlot, overview.stocks]).toEqual([
        { lessonId: 'lesson-1', startedAt: lessonStartsAt, finishesAt: lessonFinishesAt },
        before.stocks,
      ])
    })

    it('answers lesson 1 on the town with its terms, no lemma and no skill before it is studied', async () => {
      const player = await signUpWithATown()

      const {
        lessons: [lessonOne],
        skills,
        lessonSlot,
      } = await readTown(player)

      expect({ lessonOne, skills, lessonSlot }).toEqual({
        lessonOne: {
          id: 'lesson-1',
          theme: 'A day in town',
          durationSeconds: 300,
          requiredSchoolLevel: 1,
          skill: { resource: 'food', ratePercent: 5 },
          isStudied: false,
          words: wordIds.map((wordId, index) => ({
            wordId,
            standing: 'notStarted',
            reading: null,
            support: { shown: 'beside', text: lessonOneGlosses[index], language: 'es' },
          })),
        },
        skills: [],
        lessonSlot: null,
      })
    })

    it("reads a running lesson's words", async () => {
      const player = await studyLessonOne()

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]).toEqual({
        wordId: 'lesson-1-2',
        standing: 'notStarted',
        reading: { word: 'school', gloss: 'escuela', frame: 'We are at school.' },
        support: { shown: 'beside', text: 'escuela', language: 'es' },
      })
    })

    it("reads a running lesson's words under none with their definitions", async () => {
      const player = await studyLessonOne()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]).toEqual({
        wordId: 'lesson-1-2',
        standing: 'notStarted',
        reading: {
          word: 'school',
          gloss: 'a place where children go to learn',
          frame: 'We are at school.',
        },
        support: { shown: 'beside', text: 'a place where children go to learn', language: 'en' },
      })
    })

    it('shows the gloss of a word on tap once its card holds for 7 days', async () => {
      const player = await studyToTheFirstRecall()
      await runSql("UPDATE cards SET stability = 7 WHERE word_id = 'lesson-1-2'")

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]?.support).toEqual({
        shown: 'onTap',
        text: 'escuela',
        language: 'es',
      })
    })

    it('shows the definition of a word on tap once its card holds for 30 days', async () => {
      const player = await studyToTheFirstRecall()
      await runSql("UPDATE cards SET stability = 30 WHERE word_id = 'lesson-1-2'")

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]?.support).toEqual({
        shown: 'onTap',
        text: 'a place where children go to learn',
        language: 'en',
      })
    })

    it('answers the chrome Spanish to a new player under es', async () => {
      const player = await signUpWithATown()

      expect((await readTown(player)).chromePhase).toBe('scaffold')
    })

    const { chromeLessonCount } = shippedCurriculum

    const holdEveryChromeLesson = async (player: Player): Promise<ReadonlyArray<string>> => {
      const chromeLessons = (await readTown(player)).lessons.slice(0, chromeLessonCount)
      const chromeLessonIds = chromeLessons.map(({ id }) => id)
      const firstWordIds = chromeLessons.map(({ words }) => words[0]?.wordId)
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
         SELECT players.id, word_id, 'review', NULL, 9.5, 4.2, '${lessonStartsAt}', 'good', '${lessonStartsAt}'
         FROM players, unnest(ARRAY['${firstWordIds.join("', '")}']) AS word_id`,
      )
      return chromeLessonIds
    }

    it('answers the chrome in both languages once every chrome lesson holds cards', async () => {
      const player = await signUpWithATown()
      await holdEveryChromeLesson(player)

      expect((await readTown(player)).chromePhase).toBe('both')
    })

    it('answers the chrome English once every chrome lesson has earned its skill', async () => {
      const player = await signUpWithATown()
      const chromeLessonIds = await holdEveryChromeLesson(player)
      await runSql(
        `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
         SELECT players.id, lesson_id, 'food', 5, '${lessonStartsAt}'
         FROM players, unnest(ARRAY['${chromeLessonIds.join("', '")}']) AS lesson_id`,
      )

      expect((await readTown(player)).chromePhase).toBe('english')
    })

    it('answers the same chrome phase on the session and the town after an unsettled finish', async () => {
      const player = await signUpWithATown()
      const laterChromeLessons = server.lessons.chromeLessons().slice(1)
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
         SELECT players.id, word_id, 'review', NULL, 9.5, 4.2, '${lessonStartsAt}', 'good', '${lessonStartsAt}'
         FROM players, unnest(ARRAY['${laterChromeLessons.map(({ words }) => words[0]?.id).join("', '")}']) AS word_id`,
      )
      clock.setTo(lessonStartsAt)
      expect((await startLesson(player)).status).toBe(200)
      clock.setTo(firstRecallAt)

      const session = PlayerSchema.parse(await (await send(player, 'GET', '/auth/session')).json())
      const town = await readTown(player)

      expect([session.chromePhase, town.chromePhase]).toEqual(['both', 'both'])
    })

    it('answers the chrome English on the town read right after the last chrome skill is earned', async () => {
      const player = await studyToTheLastSecondRecall()
      const laterChromeLessons = server.lessons.chromeLessons().slice(1)
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
         SELECT players.id, word_id, 'review', NULL, 9.5, 4.2, '${lessonStartsAt}', 'good', '${lessonStartsAt}'
         FROM players, unnest(ARRAY['${laterChromeLessons.map(({ words }) => words[0]?.id).join("', '")}']) AS word_id`,
      )
      await runSql(
        `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
         SELECT players.id, lesson_id, 'food', 5, '${lessonStartsAt}'
         FROM players, unnest(ARRAY['${laterChromeLessons.map(({ id }) => id).join("', '")}']) AS lesson_id`,
      )
      const before = (await readTown(player)).chromePhase

      await answered(player, 'lesson-1-5', 'food')

      expect([before, (await readTown(player)).chromePhase]).toEqual(['both', 'english'])
    })

    it('reads a word of a lesson past the chrome on tap once its band is placed out', async () => {
      const player = await signUpWithATown()
      await runSql(
        `INSERT INTO placements (player_id, kind, decided_at) SELECT id, 'taken', '${lessonStartsAt}' FROM players`,
      )
      await runSql(
        `INSERT INTO placement_scores (player_id, band, score, taken_at) SELECT id, 1, 29, '${lessonStartsAt}' FROM players`,
      )

      const pastChrome = (await readTown(player)).lessons[chromeLessonCount]

      expect(pastChrome?.words.find(({ support }) => support !== null)?.support?.shown).toBe(
        'onTap',
      )
    })

    it('answers the chrome English to a player under none', async () => {
      const player = await signUpWithATown()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      expect((await readTown(player)).chromePhase).toBe('english')
    })

    it("reads a finished lesson's word until its first review", async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const finished = await readTown(player)

      await answered(
        player,
        'lesson-1-1',
        choiceIdOf(await dueReviewOf(player, 'lesson-1-1'), 'lesson-1-1'),
      )

      const reviewed = await readTown(player)
      expect(finished.lessons[0]?.words.map(({ reading }) => reading?.word)).toEqual([
        'home',
        'school',
        'work',
        'money',
        'food',
      ])
      expect(reviewed.lessons[0]?.words.map(({ reading }) => reading?.word)).toEqual([
        undefined,
        'school',
        'work',
        'money',
        'food',
      ])
    })

    it('reads nothing of a stopped or an unstudied lesson', async () => {
      const player = await studyLessonOne()
      await stopLesson(player)

      const { lessons } = await readTown(player)

      expect(
        lessons.flatMap(({ words }) => words).filter(({ reading }) => reading !== null),
      ).toEqual([])
    })

    it('reads nothing of a lesson while another lesson runs', async () => {
      const player = await studyLessonOne()

      const { lessons } = await readTown(player)

      expect(lessons[1]?.words.map(({ reading }) => reading)).toEqual(
        lessons[1]?.words.map(() => null),
      )
    })

    it('refuses lesson 1 below its school level as LessonSchoolTooLow', async () => {
      const player = await signUpWithATown()
      await runSql("UPDATE town_buildings SET level = 0 WHERE building = 'school'")

      expect(await refusalOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonSchoolTooLow' },
      })
    })

    it('refuses lesson 1 above the learning cap of the school as LearningCapReached', async () => {
      const player = await signUpWithATown()
      await runSql(`INSERT INTO cards (player_id, word_id, state, step, entered_at)
        SELECT id, 'filler-' || n, 'learning', 0, '2026-11-10T07:00:00Z' FROM players, generate_series(1, 11) AS n`)

      expect(await refusalOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LearningCapReached', params: { learningCap: 15, cardsInLearning: 11 } },
      })
    })

    it('answers the school learning cap and the cards in learning on the town', async () => {
      const player = await signUpWithATown()
      await runSql(`INSERT INTO cards (player_id, word_id, state, step, entered_at)
        SELECT id, 'filler-' || n, 'learning', 0, '2026-11-10T07:00:00Z' FROM players, generate_series(1, 3) AS n`)

      expect((await readTown(player)).learning).toEqual({
        cap: 15,
        inLearning: 3,
        retainedWords: null,
      })
    })

    it('leaves a card out of the cards in learning from a stability of 7 days, retained or not', async () => {
      const player = await signUpWithATown()
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'steady-' || n, 'review', 6 + n, 5, '2026-11-09T07:00:00Z', 'good', '2026-11-01T07:00:00Z'
        FROM players, generate_series(0, 1) AS n`)

      expect((await readTown(player)).learning).toEqual({
        cap: 15,
        inLearning: 1,
        retainedWords: null,
      })
    })

    it('refuses lesson 1 while the school studies it', async () => {
      const player = await studyLessonOne()

      expect(await refusalOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonUnderStudy' },
      })
    })

    it('refuses lesson 1 once its words are in the review', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonAlreadyStudied' },
      })
    })

    it('refuses a lesson without a town as TownNotFound', async () => {
      const player = await signUp()

      expect(await refusalOf(await startLesson(player))).toEqual({
        status: 404,
        body: { kind: 'TownNotFound' },
      })
    })

    it('answers 404 with an empty body for a lesson the content lacks', async () => {
      const player = await signUpWithATown()

      const response = await startLesson(player, 'lesson-0')

      expect([response.status, await response.text()]).toEqual([404, ''])
    })

    it('answers 400 for a body that names no lesson', async () => {
      const player = await signUpWithATown()

      const response = await send(player, 'POST', '/town/lessons', { art: 'smithing' })

      expect(response.status).toBe(400)
    })
  })

  describe('the school lesson stop route', () => {
    it('idles the school and enters no card', async () => {
      const player = await studyLessonOne()

      const overview = await overviewOf(await stopLesson(player))

      expect([overview.lessonSlot, overview.lessons[0]?.isStudied]).toEqual([null, false])
    })

    it('refuses a stop with no lesson under study as LessonStudyNotFound', async () => {
      const player = await studyLessonOne()
      await stopLesson(player)

      expect(await refusalOf(await stopLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonStudyNotFound' },
      })
    })
  })

  describe('the lesson finish', () => {
    it('enters the five cards due at the finish on the first reviews read after it', async () => {
      const player = await studyLessonOne()
      clock.setTo('2026-11-10T09:01:00Z')

      const { due } = await readReviews(player)

      expect(dueWordsOf(due)).toEqual(
        wordIds.map((wordId) => `${wordId} recognition ${lessonFinishesAt}`),
      )
    })

    it('idles the school and marks the lesson studied on the first town read after it', async () => {
      const player = await studyLessonOne()
      clock.setTo('2026-11-10T09:01:00Z')

      const { lessonSlot, lessons } = await readTown(player)

      expect([lessonSlot, lessons[0]?.isStudied]).toEqual([null, true])
    })

    it('enters no card before the finish', async () => {
      const player = await studyLessonOne()
      clock.setTo('2026-11-10T08:59:59Z')

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: null })
    })
  })

  describe('the reviews route', () => {
    it('answers no review to a player who holds no town and no card', async () => {
      const player = await signUp()

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: null })
    })

    it('answers the instant it derived the due reviews at', async () => {
      const player = await studyLessonOne()
      clock.setTo('2026-11-10T09:01:00Z')

      const { readAt } = await readReviews(player)

      expect(readAt).toBe('2026-11-10T09:01:00.000Z')
    })

    it('shows a recognition with its word, its frame and the glosses of the lesson', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      const recognition = await dueReviewOf(player, 'lesson-1-2')

      assert(recognition.mode === 'recognition')
      expect([recognition.word, recognition.frame]).toEqual(['school', 'We are at school.'])
      expect(recognition.choices.map(({ gloss }) => gloss).sort()).toEqual([
        'comida',
        'dinero',
        'escuela',
        'hogar',
        'trabajar',
      ])
    })

    it('names the right choice of a recognition by an id no other field of the card holds', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const { due } = await readReviews(player)

      const leaks = due.flatMap((recognition) => {
        assert(recognition.mode === 'recognition')
        const rightChoiceId = choiceIdOf(recognition, recognition.wordId)
        const { choices, ...card } = recognition
        const fields = [...stringsIn(card), ...choices.map(({ gloss }) => gloss)]
        return fields.filter((field) => field === rightChoiceId)
      })

      expect([due.length, leaks]).toEqual([5, []])
    })

    it('answers readFirst on the reviews', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const finished = await readReviews(player)
      await recognizeEvery(player)
      clock.setTo(secondLearningStepAt)

      const reviewed = await readReviews(player)

      expect([finished.readFirst, reviewed.readFirst]).toEqual([['lesson-1'], []])
    })

    it('answers the next due instant when nothing is due', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      await recognizeEvery(player)

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: secondLearningStepAt })
    })

    it('shows a recall with its gloss and its gapped frame and never its word', async () => {
      const player = await studyToTheFirstRecall()

      const body = await (await send(player, 'GET', '/reviews')).text()

      const recalls = ReviewsSchema.parse(JSON.parse(body)).due
      expect(recalls.find(({ wordId }) => wordId === 'lesson-1-2')).toEqual({
        mode: 'recall',
        wordId: 'lesson-1-2',
        lessonId: 'lesson-1',
        dueAt: firstRecallAt,
        gloss: 'escuela',
        gappedFrame: 'We are at ____.',
      })
      expect(recalls.map(({ mode }) => mode)).toEqual(wordIds.map(() => 'recall'))
      expect(wordIds.filter((wordId) => body.includes(`"${lemmaOf(wordId)}"`))).toEqual([])
    })

    it('shows a recall under none with the definition as its cue', async () => {
      const player = await studyToTheFirstRecall()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const { due } = await readReviews(player)

      const recall = due.find(({ wordId }) => wordId === 'lesson-1-2')
      assert(recall?.mode === 'recall')
      expect(recall.gloss).toBe('a place where children go to learn')
    })

    it('offers the definitions of the lesson as the choices of a recognition under none', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const recognition = await dueReviewOf(player, 'lesson-1-2')

      assert(recognition.mode === 'recognition')
      expect(recognition.choices.map(({ gloss }) => gloss).sort()).toEqual([
        'a place where children go to learn',
        'the place where you live',
        'to do a job for money',
        'what people and animals eat',
        'what you pay with when you buy things',
      ])
    })

    it('reads the reviews of a player whose town is gone', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      await readReviews(player)
      await runSql('DELETE FROM towns')

      expect((await readReviews(player)).due).toHaveLength(5)
    })

    it('stores one frame for two concurrent reads of one due card', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const firstHasRead = signal()
      const secondHasAnswered = signal()
      const secondIsBlockedOrHasAnswered = untilPlayerBlockedOrAnswered(secondHasAnswered.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasAnswered
        }),
      })
      const readDue = (): Promise<Response> =>
        Promise.resolve(racingApp.request('/reviews', { headers: { cookie: player.cookie } }))

      const first = readDue()
      await firstHasRead.promise
      const second = readDue().then((response) => {
        secondHasAnswered.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      expect(statuses).toEqual([200, 200])
      expect(await pendingFramesOf('lesson-1-2')).toEqual(['We are at school.'])
    })
  })

  describe('the hint route', () => {
    it('answers the first letter and the letter count of each word of a due recall', async () => {
      const player = await studyToTheFirstRecall()

      const response = await hint(player, 'lesson-1-2')

      expect(response.status).toBe(200)
      expect(ReviewHintSchema.parse(await response.json())).toEqual({
        words: [{ firstLetter: 's', letterCount: 6 }],
      })
    })

    it('rates the answer after a hint Hard, due 8 days later', async () => {
      const player = await studyToTheFirstRecall()
      await hint(player, 'lesson-1-2')

      const { verdict } = await answered(player, 'lesson-1-2', 'school')

      expect(verdict).toEqual({
        kind: 'correct',
        word: 'school',
        gloss: 'escuela',
        dueAt: '2026-11-20T09:10:00.000Z',
        earnedSkill: null,
      })
    })

    it('refuses a hint on a recognition', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await hint(player, 'lesson-1-2'))).toEqual({
        status: 409,
        body: { kind: 'HintOnRecognition' },
      })
    })

    it('refuses a hint on a card not yet due', async () => {
      const player = await studyToTheFirstRecall()
      clock.setTo('2026-11-12T09:09:59Z')

      expect(await refusalOf(await hint(player, 'lesson-1-2'))).toEqual({
        status: 409,
        body: { kind: 'ReviewNotDue' },
      })
    })
  })

  describe('the answer route', () => {
    it('grades a typed answer one letter off as a near-miss and rates nothing', async () => {
      const player = await studyToTheFirstRecall()

      const nearMiss = await answered(player, 'lesson-1-2', 'scool')

      expect(nearMiss).toEqual({ verdict: { kind: 'nearMiss' } })
      expect(dueWordsOf((await readReviews(player)).due)).toContain(
        `lesson-1-2 recall ${firstRecallAt}`,
      )
    })

    it('rates the right answer after a near-miss Hard', async () => {
      const player = await studyToTheFirstRecall()
      await answered(player, 'lesson-1-2', 'scool')

      const { verdict } = await answered(player, 'lesson-1-2', 'School ')

      expect(verdict.kind === 'correct' && verdict.dueAt).toBe('2026-11-20T09:10:00.000Z')
    })

    it('answers a wrong answer with the correct form, due again at the relearning step', async () => {
      const player = await studyToTheFirstRecall()

      const { verdict } = await answered(player, 'lesson-1-1', 'house')

      expect(verdict).toEqual({
        kind: 'wrong',
        word: 'home',
        gloss: 'hogar',
        dueAt: '2026-11-12T09:20:00.000Z',
      })
    })

    it('answers a wrong answer under none with the definition beside the correct form', async () => {
      const player = await studyToTheFirstRecall()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const { verdict } = await answered(player, 'lesson-1-1', 'house')

      assert(verdict.kind === 'wrong')
      expect([verdict.word, verdict.gloss]).toEqual(['home', 'the place where you live'])
    })

    it('grades an empty answer wrong', async () => {
      const player = await studyToTheFirstRecall()

      const { verdict } = await answered(player, 'lesson-1-1', '')

      expect(verdict.kind).toBe('wrong')
    })

    it('grades a recognition by the choice chosen', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(player, 'lesson-1-5')

      const { verdict } = await answered(
        player,
        'lesson-1-5',
        choiceIdOf(recognition, 'lesson-1-4'),
      )

      expect(verdict).toEqual({
        kind: 'wrong',
        word: 'food',
        gloss: 'comida',
        dueAt: '2026-11-10T09:01:00.000Z',
      })
    })

    it('refuses a recognition answer that is none of its choice ids and rates nothing', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      const refusal = await refusalOf(await answer(player, 'lesson-1-5', 'lesson-1-5'))

      expect(refusal).toEqual({ status: 409, body: { kind: 'UnknownChoice' } })
      expect(dueWordsOf((await readReviews(player)).due)).toContain(
        `lesson-1-5 recognition ${lessonFinishesAt}`,
      )
    })

    it('serializes two concurrent answers to one card of a player with no town', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(player, 'lesson-1-2')
      await runSql('DELETE FROM towns')
      const firstHasRead = signal()
      const secondHasAnswered = signal()
      const secondIsBlockedOrHasAnswered = untilPlayerBlockedOrAnswered(secondHasAnswered.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasAnswered
        }),
      })
      const answerRight = (): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/reviews/lesson-1-2/answer', {
            method: 'POST',
            headers: { cookie: player.cookie, 'content-type': 'application/json' },
            body: JSON.stringify({ answer: choiceIdOf(recognition, 'lesson-1-2') }),
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

    it('refuses a word the player holds no card of', async () => {
      const player = await signUpWithATown()

      expect(await refusalOf(await answer(player, 'lesson-1-1', 'home'))).toEqual({
        status: 409,
        body: { kind: 'WordNotHeld' },
      })
    })

    it('refuses a word no lesson holds', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await answer(player, 'home', 'home'))).toEqual({
        status: 409,
        body: { kind: 'UnknownWord' },
      })
    })

    it('refuses an answer to a card not yet due', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(player, 'lesson-1-1')
      await answered(player, 'lesson-1-1', choiceIdOf(recognition, 'lesson-1-1'))
      clock.setTo('2026-11-10T09:05:00Z')

      expect(await refusalOf(await answer(player, 'lesson-1-1', 'home'))).toEqual({
        status: 409,
        body: { kind: 'ReviewNotDue' },
      })
    })

    it('answers 400 for an answer above 100 characters', async () => {
      const player = await studyToTheFirstRecall()

      const response = await answer(player, 'lesson-1-1', 'h'.repeat(101))

      expect(response.status).toBe(400)
    })
  })

  describe('lesson 1 from its study to its skill', () => {
    it('steps every card as the worked example of ADR 036 does, the first recall answered late', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const firstRead = await readReviews(player)
      const firstRecognitions = await recognizeEvery(player)
      clock.setTo(secondLearningStepAt)
      const secondRecognitions = await recognizeEvery(player)
      clock.setTo(firstRecallAt)
      const recallRead = await readReviews(player)
      clock.setTo(lateFirstRecallAt)
      const firstRecalls = await answerEvery(player, lemmaOf)

      expect(dueWordsOf(firstRead.due)).toEqual(
        wordIds.map((wordId) => `${wordId} recognition ${lessonFinishesAt}`),
      )
      expect(dueAtsOf(firstRecognitions)).toEqual(wordIds.map(() => secondLearningStepAt))
      expect(dueAtsOf(secondRecognitions)).toEqual(wordIds.map(() => firstRecallAt))
      expect(dueWordsOf(recallRead.due)).toEqual(
        wordIds.map((wordId) => `${wordId} recall ${firstRecallAt}`),
      )
      expect(dueAtsOf(firstRecalls)).toEqual(wordIds.map(() => secondRecallAt))
    })

    it('earns no skill before the second recall of the last word', async () => {
      const player = await studyToTheLastSecondRecall()

      const { skills, lessons } = await readTown(player)

      expect(skills).toEqual([])
      expect(lessons[0]?.words.map(({ standing }) => standing)).toEqual([
        'retained',
        'retained',
        'retained',
        'retained',
        'hold',
      ])
    })

    it('answers the retained words on the overview', async () => {
      const player = await studyToTheLastSecondRecall()

      const { learning } = await readTown(player)

      expect(learning.retainedWords).toEqual({ count: 4, total: 5 })
    })

    it('answers no retained words before the first lesson', async () => {
      const player = await signUpWithATown()

      const { learning } = await readTown(player)

      expect(learning.retainedWords).toBeNull()
    })

    it("earns the food skill at the second recall with the town's rates before and after", async () => {
      const player = await studyToTheLastSecondRecall()
      await runSql("UPDATE town_buildings SET level = 2 WHERE building = 'farm'")
      const before = await readTown(player)

      const { verdict } = await answered(player, 'lesson-1-5', 'food')

      const after = await readTown(player)
      expect(verdict).toEqual({
        kind: 'correct',
        word: 'food',
        gloss: 'comida',
        dueAt: '2027-01-08T15:00:00.000Z',
        earnedSkill: {
          lessonId: 'lesson-1',
          resource: 'food',
          ratePercent: 5,
          earnedAt: secondRecallAt,
          level: 1,
          ratePerHourBefore: before.stocks.food.ratePerHour,
          ratePerHourAfter: after.stocks.food.ratePerHour,
          words: ['home', 'school', 'work', 'money', 'food'],
        },
      })
      expect(after.stocks.food.ratePerHour).toBeGreaterThan(before.stocks.food.ratePerHour)
    })

    it('carries the earned skill on the town overview', async () => {
      const player = await studyToTheLastSecondRecall()

      await answered(player, 'lesson-1-5', 'food')

      expect((await readTown(player)).skills).toEqual([
        { lessonId: 'lesson-1', resource: 'food', ratePercent: 5, earnedAt: secondRecallAt },
      ])
    })

    it('earns the skill with no rates for a player whose town is gone', async () => {
      const player = await studyToTheLastSecondRecall()
      await runSql('DELETE FROM towns')

      const { verdict } = await answered(player, 'lesson-1-5', 'food')

      expect(verdict.kind === 'correct' && verdict.earnedSkill).toEqual({
        lessonId: 'lesson-1',
        resource: 'food',
        ratePercent: 5,
        earnedAt: secondRecallAt,
        level: 1,
        ratePerHourBefore: null,
        ratePerHourAfter: null,
        words: ['home', 'school', 'work', 'money', 'food'],
      })
    })

    it('lends a town founded after the earn the skill earned without one', async () => {
      const player = await studyToTheLastSecondRecall()
      await runSql('DELETE FROM towns')
      await answered(player, 'lesson-1-5', 'food')

      const founded = await overviewOf(await send(player, 'POST', '/town', { name: 'Cedar Creek' }))

      expect(founded.skills.map(({ lessonId }) => lessonId)).toEqual(['lesson-1'])
    })
  })

  describe('the holdout', () => {
    const bandLessonHeadwords = ['say', 'time', 'year', 'think', 'come']

    const bandLesson = (): ShelvedLesson => {
      const lessonOne = server.lessons.lessonOf('lesson-1')
      assert(lessonOne !== undefined)
      return {
        ...lessonOne,
        id: 'lesson-fixture-holdout',
        theme: 'Saying and thinking',
        words: bandLessonHeadwords.map((headword) => ({
          id: `word-${headword}`,
          acceptedForms: [headword] as const,
          gloss: `gloss of ${headword}`,
          definition: `definition of ${headword}`,
          frames: [{ frame: `They ${headword} it.`, gappedFrame: 'They ____ it.' }],
        })),
      }
    }

    const libraryWithBandLesson = (): LessonLibrary => {
      const lesson = bandLesson()
      const { lessons } = server
      return {
        lessonOf: (lessonId) => (lessonId === lesson.id ? lesson : lessons.lessonOf(lessonId)),
        lessonOfWord: (wordId) =>
          lesson.words.some(({ id }) => id === wordId) ? lesson : lessons.lessonOfWord(wordId),
        isHeadword: (word) => lessons.isHeadword(word),
        bandOfLesson: (lessonId) => (lessonId === lesson.id ? 1 : lessons.bandOfLesson(lessonId)),
        wordsOfBand: (band) => lessons.wordsOfBand(band),
        hasLessons: (band) => lessons.hasLessons(band),
        placementWordsOf: (band) => lessons.placementWordsOf(band),
        lessons: () => [...lessons.lessons(), lesson],
        chromeLessons: () => lessons.chromeLessons(),
      }
    }

    const holdingOutSayAndTheLastRanks: RandomSource = {
      sampleOf: <T>(items: ReadonlyArray<T>, count: number): ReadonlyArray<T> => {
        const others = items.filter((item) => item !== 'say').reverse()
        return [...items.filter((item) => item === 'say'), ...others].slice(0, count)
      },
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

    const heldOutCount = async (): Promise<number> => {
      const [counted] = await storedRows<{ count: number }>(
        'SELECT count(*)::int AS count FROM held_out_words',
      )
      assert(counted !== undefined)
      return counted.count
    }

    beforeEach(() => {
      app = createApp({ ...server, clock, lessons: libraryWithBandLesson() })
    })

    it("stores a tenth of band 1's card words outside the chrome lessons", async () => {
      const player = await signUpWithATown()

      expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(200)

      expect(await heldOutCount()).toBe(87)
    })

    it('stores the instant of the band start', async () => {
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)

      await startLesson(player, 'lesson-fixture-holdout')

      expect(await storedRows('SELECT band, started_at AS "startedAt" FROM band_starts')).toEqual([
        { band: 1, startedAt: new Date(lessonStartsAt) },
      ])
    })

    it('draws nothing when a chrome lesson starts', async () => {
      const player = await signUpWithATown()

      await startLesson(player, 'lesson-1')

      expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
    })

    it('stores no draw for a start the busy slot refuses', async () => {
      const player = await signUpWithATown()
      await startLesson(player, 'lesson-1')

      expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(409)

      expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
    })

    it('keeps the draw when a stopped lesson starts again', async () => {
      const player = await signUpWithATown()
      await startLesson(player, 'lesson-fixture-holdout')
      const drawn = await storedRows('SELECT headword FROM held_out_words ORDER BY headword')
      await stopLesson(player, 'lesson-fixture-holdout')

      await startLesson(player, 'lesson-fixture-holdout')

      expect(await storedRows('SELECT headword FROM held_out_words ORDER BY headword')).toEqual(
        drawn,
      )
    })

    it('never reads a held-out word', async () => {
      app = createApp({
        ...server,
        clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')

      const running = await readTown(player)
      clock.setTo(lessonFinishesAt)
      const finished = await readTown(player)

      const readWordsOf = ({ lessons }: TownOverview): ReadonlyArray<string> =>
        lessons
          .find(({ id }) => id === 'lesson-fixture-holdout')
          ?.words.flatMap(({ reading }) => (reading === null ? [] : [reading.word])) ?? []
      const heldOutContentIn = ({ lessons }: TownOverview): ReadonlyArray<string> =>
        stringsIn(lessons).filter((text) =>
          ['say', 'gloss of say', 'definition of say', 'They say it.'].includes(text),
        )
      const entering = ['time', 'year', 'think', 'come']
      expect([readWordsOf(running), readWordsOf(finished)]).toEqual([entering, entering])
      expect([heldOutContentIn(running), heldOutContentIn(finished)]).toEqual([[], []])
    })

    it("never reads a held-out word on the start's own answer", async () => {
      app = createApp({
        ...server,
        clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)

      const { lessons } = await overviewOf(await startLesson(player, 'lesson-fixture-holdout'))

      const lesson = lessons.find(({ id }) => id === 'lesson-fixture-holdout')
      expect(lesson?.words.find(({ wordId }) => wordId === 'word-say')?.reading).toBeNull()
    })

    it('enters no card for a held-out word when the lesson finishes', async () => {
      app = createApp({
        ...server,
        clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')
      clock.setTo(lessonFinishesAt)

      const { due } = await readReviews(player)

      expect(due.map(({ wordId }) => wordId).sort()).toEqual([
        'word-come',
        'word-think',
        'word-time',
        'word-year',
      ])
    })

    it("leaves a held-out word out of the skill's words", async () => {
      app = createApp({
        ...server,
        clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')
      const headwordOf = (wordId: string): string => wordId.replace('word-', '')
      const recognizeTheBandLesson = async (): Promise<void> => {
        for (const review of (await readReviews(player)).due) {
          assert(review.mode === 'recognition')
          const right = review.choices.find(
            ({ gloss }) => gloss === `gloss of ${headwordOf(review.wordId)}`,
          )
          assert(right !== undefined)
          await answered(player, review.wordId, right.choiceId)
        }
      }
      const recallTheBandLesson = async (): Promise<ReadonlyArray<ReviewAnswer>> => {
        const answers: Array<ReviewAnswer> = []
        for (const review of (await readReviews(player)).due) {
          answers.push(await answered(player, review.wordId, headwordOf(review.wordId)))
        }
        return answers
      }
      clock.setTo(lessonFinishesAt)
      await recognizeTheBandLesson()
      clock.setTo(secondLearningStepAt)
      await recognizeTheBandLesson()
      clock.setTo(lateFirstRecallAt)
      await recallTheBandLesson()
      clock.setTo(secondRecallAt)

      const earned = (await recallTheBandLesson()).flatMap(({ verdict }) =>
        verdict.kind === 'correct' && verdict.earnedSkill !== null ? [verdict.earnedSkill] : [],
      )

      expect(earned.map(({ lessonId, words }) => ({ lessonId, words }))).toEqual([
        { lessonId: 'lesson-fixture-holdout', words: ['time', 'year', 'think', 'come'] },
      ])
    })

    it('offers no held-out gloss among the recognition choices', async () => {
      app = createApp({
        ...server,
        clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')
      clock.setTo(lessonFinishesAt)

      const { due } = await readReviews(player)

      expect(stringsIn(due)).not.toContain('gloss of say')
    })
  })
  describe('the later frames', () => {
    const laterFrameOfSchool = {
      frame: 'My school is new.',
      gappedFrame: 'My ____ is new.',
      fromLessonId: 'lesson-fixture-later',
    }

    const libraryWithALaterFrame = (): LessonLibrary => {
      const { lessons } = server
      const lessonOne = lessons.lessons().find(({ id }) => id === 'lesson-1')
      assert(lessonOne !== undefined)
      const variedLessonOne: ShelvedLesson = {
        ...lessonOne,
        words: lessonOne.words.map((word) =>
          word.id === 'lesson-1-2'
            ? { ...word, frames: [word.frames[0], laterFrameOfSchool] }
            : word,
        ),
      }
      const bandLesson: ShelvedLesson = {
        ...lessonOne,
        id: 'lesson-fixture-later',
        theme: 'Saying and thinking',
        words: [
          {
            id: 'word-say',
            acceptedForms: ['say'],
            gloss: 'decir',
            definition: 'to tell something with words',
            frames: [{ frame: 'They say it.', gappedFrame: 'They ____ it.' }],
          },
        ],
      }
      const shelved = [variedLessonOne, bandLesson]
      return {
        lessonOf: (lessonId) => shelved.find(({ id }) => id === lessonId),
        lessonOfWord: (wordId) =>
          shelved.find(({ words }) => words.some(({ id }) => id === wordId)),
        isHeadword: (word) => lessons.isHeadword(word),
        bandOfLesson: (lessonId) => (lessonId === bandLesson.id ? 1 : undefined),
        wordsOfBand: (band) => lessons.wordsOfBand(band),
        hasLessons: (band) => lessons.hasLessons(band),
        placementWordsOf: (band) => lessons.placementWordsOf(band),
        lessons: () => shelved,
        chromeLessons: () => lessons.chromeLessons(),
      }
    }

    const placeOutOfBandOne = async (): Promise<void> => {
      await runSql(
        `INSERT INTO placements (player_id, kind, decided_at) SELECT id, 'taken', '${lessonStartsAt}' FROM players`,
      )
      await runSql(
        `INSERT INTO placement_scores (player_id, band, score, taken_at) SELECT id, 1, 29, '${lessonStartsAt}' FROM players`,
      )
    }

    const recallOfSchool = async (player: Player): Promise<DueReview> => {
      const recall = await dueReviewOf(player, 'lesson-1-2')
      assert(recall.mode === 'recall')
      return recall
    }

    beforeEach(() => {
      app = createApp({ ...server, clock, lessons: libraryWithALaterFrame() })
    })

    it('shows the anchor in recall while the stage reaches no later frame', async () => {
      const player = await studyToTheFirstRecall()

      expect(await recallOfSchool(player)).toMatchObject({ gappedFrame: 'We are at ____.' })
    })

    it('shows a later frame in recall once the stage reaches its lesson', async () => {
      const player = await studyToTheFirstRecall()
      await placeOutOfBandOne()

      expect(await recallOfSchool(player)).toMatchObject({ gappedFrame: 'My ____ is new.' })
    })

    it('shows the Report the recall frame the reviews route shows', async () => {
      const player = await studyToTheFirstRecall()
      await placeOutOfBandOne()

      const report = ReportSchema.parse(await (await send(player, 'GET', '/report')).json())

      expect(report.due.find(({ wordId }) => wordId === 'lesson-1-2')).toEqual(
        await recallOfSchool(player),
      )
    })

    it('shows the recall frame first shown again though the stage has grown since', async () => {
      const player = await studyToTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()

      expect(await recallOfSchool(player)).toMatchObject({ gappedFrame: 'We are at ____.' })
    })

    it('shows the recall frame the Report first showed though the stage has grown since', async () => {
      const player = await studyToTheFirstRecall()
      await send(player, 'GET', '/report')
      await placeOutOfBandOne()

      expect(await recallOfSchool(player)).toMatchObject({ gappedFrame: 'We are at ____.' })
    })

    it('logs the frame the recall showed though the stage admits another at the answer', async () => {
      const player = await studyToTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()

      await answered(player, 'lesson-1-2', 'school')

      expect((await loggedFramesOf('lesson-1-2')).at(-1)).toBe('We are at ____.')
    })

    it('logs the later frame a recall showed', async () => {
      const player = await studyToTheFirstRecall()
      await placeOutOfBandOne()
      await recallOfSchool(player)

      await answered(player, 'lesson-1-2', 'school')

      expect((await loggedFramesOf('lesson-1-2')).at(-1)).toBe('My ____ is new.')
    })

    it('logs the frame shown through a hint and a near-miss', async () => {
      const player = await studyToTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()
      await hint(player, 'lesson-1-2')
      await answered(player, 'lesson-1-2', 'scool')

      await answered(player, 'lesson-1-2', 'school')

      expect((await loggedFramesOf('lesson-1-2')).at(-1)).toBe('We are at ____.')
    })

    it('logs the full anchor each recognition showed', async () => {
      await studyToTheFirstRecall()

      expect(await loggedFramesOf('lesson-1-2')).toEqual(['We are at school.', 'We are at school.'])
    })

    it('chooses the recall frame anew once the review is rated', async () => {
      const player = await studyToTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()
      await answered(player, 'lesson-1-2', 'school')
      clock.setTo(secondRecallAt)

      expect(await recallOfSchool(player)).toMatchObject({ gappedFrame: 'My ____ is new.' })
    })

    it('logs no frame for an answer no read showed', async () => {
      const player = await studyToTheFirstRecall()

      await answered(player, 'lesson-1-2', 'school')

      expect((await loggedFramesOf('lesson-1-2')).at(-1)).toBeNull()
    })

    it('shows the anchor in recognition though the stage reaches a later frame', async () => {
      const player = await studyLessonOne()
      await placeOutOfBandOne()
      clock.setTo(lessonFinishesAt)

      expect(await dueReviewOf(player, 'lesson-1-2')).toMatchObject({
        mode: 'recognition',
        frame: 'We are at school.',
      })
    })

    it('reads a word with its anchor though the stage reaches a later frame', async () => {
      const player = await studyLessonOne()
      await placeOutOfBandOne()
      clock.setTo(lessonFinishesAt)

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]?.reading).toEqual({
        word: 'school',
        gloss: 'escuela',
        frame: 'We are at school.',
      })
    })
  })
})

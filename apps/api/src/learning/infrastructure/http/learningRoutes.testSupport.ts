import {
  ApiErrorSchema,
  type DueReview,
  type ReviewAnswer,
  ReviewAnswerSchema,
  type Reviews,
  ReviewsSchema,
  type TownOverview,
  TownOverviewSchema,
} from '@mygame/contracts'
import type { CardRepository, UnitOfWork } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, expect } from 'vitest'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import type { ComposedStores } from '#composeStores'
import { isWaitingOnALock, lockedPlayerReadQuery, lockProbeLimit } from '#lockWaitProbe.testSupport'
import { type SettableClock, settableClock } from '#settableClock.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

const contentDirectory = apiPackagePath('content/')

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

export const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

export const loggedFramesOf = async (wordId: string): Promise<ReadonlyArray<string | null>> => {
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

export const pendingFramesOf = async (wordId: string): Promise<ReadonlyArray<string | null>> => {
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

export const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
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

export const pausingFirstUnitOfWork = (
  unitOfWork: UnitOfWork<ComposedStores>,
  afterFirstCardRead: () => Promise<void>,
): UnitOfWork<ComposedStores> => {
  let transactions = 0
  return {
    transact: (work) => {
      transactions += 1
      const isFirst = transactions === 1
      return unitOfWork.transact((stores) =>
        work(
          isFirst
            ? { ...stores, cards: pausingFirstCardRead(stores.cards, afterFirstCardRead) }
            : stores,
        ),
      )
    },
  }
}

export const untilPlayerBlockedOrAnswered = async (
  secondAnswer: Promise<unknown>,
): Promise<void> => {
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

export type Player = {
  readonly cookie: string
}

const lemmas: Readonly<Record<string, string>> = {
  'lesson-1-1': 'home',
  'lesson-1-2': 'school',
  'lesson-1-3': 'work',
  'lesson-1-4': 'money',
  'lesson-1-5': 'food',
}

export const wordIds = Object.keys(lemmas)

export const lemmaOf = (wordId: string): string => lemmas[wordId] ?? ''

const glosses: Readonly<Record<string, string>> = {
  'lesson-1-1': 'hogar',
  'lesson-1-2': 'escuela',
  'lesson-1-3': 'trabajar',
  'lesson-1-4': 'dinero',
  'lesson-1-5': 'comida',
}

export const choiceIdOf = (recognition: DueReview, chosenWordId: string): string => {
  assert(recognition.mode === 'recognition')
  const choice = recognition.choices.find(({ gloss }) => gloss === glosses[chosenWordId])
  assert(choice !== undefined)
  return choice.choiceId
}

export const stringsIn = (value: unknown): ReadonlyArray<string> => {
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

export const lessonStartsAt = '2026-11-10T08:55:00.000Z'

export const lessonFinishesAt = '2026-11-10T09:00:00.000Z'

export const secondLearningStepAt = '2026-11-10T09:10:00.000Z'

export const firstRecallAt = '2026-11-12T09:10:00.000Z'

export const lateFirstRecallAt = '2026-11-12T15:00:00.000Z'

export const secondRecallAt = '2026-11-23T15:00:00.000Z'

export const overviewOf = async (response: Response): Promise<TownOverview> => {
  expect(response.status).toBe(200)
  return TownOverviewSchema.parse(await response.json())
}

export const refusalOf = async (response: Response): Promise<unknown> => ({
  status: response.status,
  body: ApiErrorSchema.parse(await response.json()),
})

export const seedLessonOneStudied = (): Promise<void> =>
  runSql(
    `INSERT INTO town_events (town_id, kind, lesson_id, occurred_at)
     SELECT id, 'lesson_studied', 'lesson-1', '${lessonFinishesAt}' FROM towns`,
  )

export const dueWordsOf = (due: ReadonlyArray<DueReview>): ReadonlyArray<string> =>
  due.map(({ wordId, mode, dueAt }) => `${wordId} ${mode} ${dueAt}`)

export const dueAtsOf = (answers: ReadonlyArray<ReviewAnswer>): ReadonlyArray<string | undefined> =>
  answers.map(({ verdict }) => (verdict.kind === 'nearMiss' ? undefined : verdict.dueAt))

type App = ReturnType<typeof createApp>

export type LearningWorld = {
  readonly server: ComposedServer
  readonly clock: SettableClock
  app: App
  readonly send: (player: Player, method: string, path: string, body?: unknown) => Promise<Response>
  readonly signUp: () => Promise<Player>
  readonly signUpWithATown: () => Promise<Player>
  readonly readTown: (player: Player) => Promise<TownOverview>
  readonly readReviews: (player: Player) => Promise<Reviews>
  readonly startLesson: (player: Player, lessonId?: string) => Promise<Response>
  readonly stopLesson: (player: Player, lessonId?: string) => Promise<Response>
  readonly answer: (player: Player, wordId: string, given: string) => Promise<Response>
  readonly answered: (player: Player, wordId: string, given: string) => Promise<ReviewAnswer>
  readonly hint: (player: Player, wordId: string) => Promise<Response>
  readonly studyLessonOne: () => Promise<Player>
  readonly answerEvery: (
    player: Player,
    answerOf: (wordId: string) => string,
  ) => Promise<ReadonlyArray<ReviewAnswer>>
  readonly dueReviewOf: (player: Player, wordId: string) => Promise<DueReview>
  readonly recognizeEvery: (player: Player) => Promise<ReadonlyArray<ReviewAnswer>>
  readonly studyToTheFirstRecall: () => Promise<Player>
  readonly seedTheFirstRecall: () => Promise<Player>
  readonly studyToTheLastSecondRecall: () => Promise<Player>
}

export function learningWorld(): LearningWorld {
  let server: ComposedServer
  let clock: SettableClock
  let app: App

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
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

  const seedTheFirstRecall = async (): Promise<Player> => {
    const player = await signUpWithATown()
    await seedLessonOneStudied()
    await runSql(
      `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
       SELECT players.id, word_id, 'review', NULL, 2.3065, 2.111214235785395, '${secondLearningStepAt}', 'good', '${lessonFinishesAt}'
       FROM players, unnest(ARRAY['${wordIds.join("', '")}']) AS word_id`,
    )
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

  return {
    get server(): ComposedServer {
      return server
    },
    get clock(): SettableClock {
      return clock
    },
    get app(): App {
      return app
    },
    set app(next: App) {
      app = next
    },
    send,
    signUp,
    signUpWithATown,
    readTown,
    readReviews,
    startLesson,
    stopLesson,
    answer,
    answered,
    hint,
    studyLessonOne,
    answerEvery,
    dueReviewOf,
    recognizeEvery,
    studyToTheFirstRecall,
    seedTheFirstRecall,
    studyToTheLastSecondRecall,
  }
}

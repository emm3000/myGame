import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  type DueReview,
  type ReviewAnswer,
  ReviewAnswerSchema,
  ReviewHintSchema,
  type Reviews,
  ReviewsSchema,
} from '@mygame/contracts'
import { type TownOverview, TownOverviewSchema } from '@mygame/contracts/town'
import { type Clock, Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

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
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, player_seen_hints, player_skills, earned_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
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
        fiefName: 'Valdehierro',
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

      const { lessons, skills, lessonSlot } = await readTown(player)

      expect({ lessons, skills, lessonSlot }).toEqual({
        lessons: [
          {
            id: 'lesson-1',
            theme: 'A day in town',
            durationSeconds: 300,
            requiredSchoolLevel: 1,
            skill: { resource: 'food', ratePercent: 5 },
            isStudied: false,
            words: wordIds.map((wordId) => ({ wordId, isRetained: false })),
          },
        ],
        skills: [],
        lessonSlot: null,
      })
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
        body: { kind: 'LearningCapReached' },
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

      const response = await startLesson(player, 'lesson-9')

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

      expect(await readReviews(player)).toEqual({ due: [], nextDueAt: null })
    })
  })

  describe('the reviews route', () => {
    it('answers no review to a player who holds no town and no card', async () => {
      const player = await signUp()

      expect(await readReviews(player)).toEqual({ due: [], nextDueAt: null })
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

    it('answers the next due instant when nothing is due', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      await recognizeEvery(player)

      expect(await readReviews(player)).toEqual({ due: [], nextDueAt: secondLearningStepAt })
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

    it('reads the reviews of a player whose town is gone', async () => {
      const player = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      await readReviews(player)
      await runSql('DELETE FROM towns')

      expect((await readReviews(player)).due).toHaveLength(5)
    })
  })

  describe('the hint route', () => {
    it('answers the first letter and the letter count of a due recall', async () => {
      const player = await studyToTheFirstRecall()

      const response = await hint(player, 'lesson-1-2')

      expect(response.status).toBe(200)
      expect(ReviewHintSchema.parse(await response.json())).toEqual({
        firstLetter: 's',
        letterCount: 6,
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
      expect(lessons[0]?.words.map(({ isRetained }) => isRetained)).toEqual([
        true,
        true,
        true,
        true,
        false,
      ])
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
      })
    })

    it('lends a town founded after the earn the skill earned without one', async () => {
      const player = await studyToTheLastSecondRecall()
      await runSql('DELETE FROM towns')
      await answered(player, 'lesson-1-5', 'food')

      const founded = await overviewOf(await send(player, 'POST', '/town', { name: 'Cedar Creek' }))

      expect(founded.skills.map(({ lessonId }) => lessonId)).toEqual(['lesson-1'])
    })

    it('never writes the skill to the fief', async () => {
      const player = await studyToTheLastSecondRecall()

      await answered(player, 'lesson-1-5', 'food')

      const client = new Client({ connectionString: databaseUrl() })
      await client.connect()
      try {
        const rows = await client.query('SELECT count(*)::int AS count FROM player_skills')
        expect(rows.rows).toEqual([{ count: 0 }])
      } finally {
        await client.end()
      }
    })
  })
})

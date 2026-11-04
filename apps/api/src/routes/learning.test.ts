import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  FiefChronicleSchema,
  FiefListSchema,
  type FiefOverview,
  FiefOverviewSchema,
  type ReviewAnswer,
  ReviewAnswerSchema,
  ReviewHintSchema,
} from '@mygame/contracts'
import { type Clock, campOf, type FiefId, Instant } from '@mygame/domain'
import { Client, Pool } from 'pg'
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
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

type Lord = {
  readonly cookie: string
  readonly fiefId: FiefId
}

type DueReview = FiefOverview['reviews']['due'][number]

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

const statementTextOf = (query: unknown): string => {
  if (typeof query === 'string') {
    return query
  }
  if (typeof query === 'object' && query !== null && 'text' in query) {
    return String(query.text)
  }
  return ''
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

const lessonStartsAt = '2026-11-10T08:57:30.000Z'

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
      'TRUNCATE players, player_seen_hints, player_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    clock = settableClock('2026-11-10T08:00:00Z')
    app = createApp({ ...server, clock })
  })

  const signUp = async (): Promise<Lord> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
        fiefName: 'Valdehierro',
      }),
    })
    const cookie = sessionCookieOf(response)
    const fiefs = await app.request('/fiefs', { headers: { cookie } })
    const [fief] = FiefListSchema.parse(await fiefs.json()).fiefs
    assert(fief !== undefined)
    return { cookie, fiefId: fief.id }
  }

  const post = async (lord: Lord, path: string, body?: unknown): Promise<Response> =>
    app.request(`/fiefs/${lord.fiefId}${path}`, {
      method: 'POST',
      headers: {
        cookie: lord.cookie,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })

  const readFief = async (lord: Lord): Promise<FiefOverview> => {
    const response = await app.request(`/fiefs/${lord.fiefId}`, {
      headers: { cookie: lord.cookie },
    })
    expect(response.status).toBe(200)
    return FiefOverviewSchema.parse(await response.json())
  }

  const startLesson = (lord: Lord, lessonId = 'lesson-1'): Promise<Response> =>
    post(lord, '/lessons', { lessonId })

  const cancelLesson = async (lord: Lord, lessonId = 'lesson-1'): Promise<Response> =>
    app.request(`/fiefs/${lord.fiefId}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { cookie: lord.cookie },
    })

  const answer = (lord: Lord, wordId: string, given: string): Promise<Response> =>
    post(lord, `/reviews/${wordId}/answer`, { answer: given })

  const answered = async (lord: Lord, wordId: string, given: string): Promise<ReviewAnswer> => {
    const response = await answer(lord, wordId, given)
    expect(response.status).toBe(200)
    return ReviewAnswerSchema.parse(await response.json())
  }

  const hint = (lord: Lord, wordId: string): Promise<Response> =>
    post(lord, `/reviews/${wordId}/hint`)

  const refusalOf = async (response: Response): Promise<unknown> => ({
    status: response.status,
    body: ApiErrorSchema.parse(await response.json()),
  })

  const signUpWithALibrary = async (): Promise<Lord> => {
    const lord = await signUp()
    const enqueued = await post(lord, '/upgrades', { building: 'library' })
    expect(enqueued.status).toBe(200)
    return lord
  }

  const studyLessonOne = async (): Promise<Lord> => {
    const lord = await signUpWithALibrary()
    clock.setTo(lessonStartsAt)
    const started = await startLesson(lord)
    expect(started.status).toBe(200)
    return lord
  }

  const answerEvery = async (
    lord: Lord,
    answerOf: (wordId: string) => string,
  ): Promise<ReadonlyArray<ReviewAnswer>> => {
    const answers: Array<ReviewAnswer> = []
    for (const wordId of wordIds) {
      answers.push(await answered(lord, wordId, answerOf(wordId)))
    }
    return answers
  }

  const dueReviewOf = async (lord: Lord, wordId: string): Promise<DueReview> => {
    const { reviews } = await readFief(lord)
    const review = reviews.due.find((due) => due.wordId === wordId)
    assert(review !== undefined)
    return review
  }

  const recognizeEvery = async (lord: Lord): Promise<ReadonlyArray<ReviewAnswer>> => {
    const { reviews } = await readFief(lord)
    const answers: Array<ReviewAnswer> = []
    for (const review of reviews.due) {
      answers.push(await answered(lord, review.wordId, choiceIdOf(review, review.wordId)))
    }
    return answers
  }

  const studyToTheFirstRecall = async (): Promise<Lord> => {
    const lord = await studyLessonOne()
    clock.setTo(lessonFinishesAt)
    await recognizeEvery(lord)
    clock.setTo(secondLearningStepAt)
    await recognizeEvery(lord)
    clock.setTo(firstRecallAt)
    return lord
  }

  const studyToTheSecondRecall = async (): Promise<Lord> => {
    const lord = await studyToTheFirstRecall()
    clock.setTo(lateFirstRecallAt)
    await answerEvery(lord, lemmaOf)
    clock.setTo(secondRecallAt)
    return lord
  }

  const dueWordsOf = (due: ReadonlyArray<DueReview>): ReadonlyArray<string> =>
    due.map(({ wordId, mode, dueAt }) => `${wordId} ${mode} ${dueAt}`)

  const dueAtsOf = (answers: ReadonlyArray<ReviewAnswer>): ReadonlyArray<string | undefined> =>
    answers.map(({ verdict }) => (verdict.kind === 'nearMiss' ? undefined : verdict.dueAt))

  describe('the lesson route', () => {
    it('studies lesson 1 in the study slot for 150 s at library 1, costing nothing', async () => {
      const lord = await signUpWithALibrary()
      clock.setTo(lessonStartsAt)
      const before = await readFief(lord)

      const response = await startLesson(lord)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect(overview.study).toEqual({
        kind: 'lesson',
        lessonId: 'lesson-1',
        startedAt: lessonStartsAt,
        finishesAt: lessonFinishesAt,
      })
      expect(overview.resources).toEqual(before.resources)
    })

    it('answers lesson 1 with its terms and no lemma before it is studied', async () => {
      const lord = await signUpWithALibrary()
      clock.setTo(lessonStartsAt)

      const { lessons, reviews, skills } = await readFief(lord)

      expect({ lessons, reviews, skills }).toEqual({
        lessons: [
          {
            id: 'lesson-1',
            theme: 'A day in town',
            durationSeconds: 150,
            requiredLibraryLevel: 1,
            skill: { resource: 'food', ratePercent: 5 },
            isStudied: false,
            words: wordIds.map((wordId) => ({ wordId, isRetained: false })),
          },
        ],
        reviews: { due: [], nextDueAt: null },
        skills: [],
      })
    })

    it('refuses lesson 1 without a library', async () => {
      const lord = await signUp()

      expect(await refusalOf(await startLesson(lord))).toEqual({
        status: 409,
        body: {
          kind: 'LessonLibraryTooLow',
        },
      })
    })

    it('refuses lesson 1 while an art holds the study slot', async () => {
      const lord = await signUpWithALibrary()
      await runSql('UPDATE fiefs SET gold = 100')
      clock.setTo(lessonStartsAt)
      const studied = await post(lord, '/studies', { art: 'smithing' })
      expect(studied.status).toBe(200)

      expect(await refusalOf(await startLesson(lord))).toEqual({
        status: 409,
        body: {
          kind: 'StudySlotBusy',
        },
      })
    })

    it('refuses lesson 1 while a study slot of the player studies it', async () => {
      const lord = await studyLessonOne()

      expect(await refusalOf(await startLesson(lord))).toEqual({
        status: 409,
        body: {
          kind: 'LessonUnderStudy',
        },
      })
    })

    it('refuses lesson 1 once its words are in the review', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await startLesson(lord))).toEqual({
        status: 409,
        body: {
          kind: 'LessonAlreadyStudied',
        },
      })
    })

    it('answers 404 with an empty body for a lesson the content lacks', async () => {
      const lord = await signUpWithALibrary()

      const response = await startLesson(lord, 'lesson-9')

      expect([response.status, await response.text()]).toEqual([404, ''])
    })

    it('answers 400 for a body that names no lesson', async () => {
      const lord = await signUpWithALibrary()

      const response = await post(lord, '/lessons', { art: 'smithing' })

      expect(response.status).toBe(400)
    })
  })

  describe('the lesson cancel route', () => {
    it('idles the study slot and refunds nothing', async () => {
      const lord = await studyLessonOne()
      const studying = await readFief(lord)

      const response = await cancelLesson(lord)

      expect(response.status).toBe(200)
      const overview = FiefOverviewSchema.parse(await response.json())
      expect([overview.study, overview.resources]).toEqual([{ kind: 'idle' }, studying.resources])
    })

    it('records the cancel on the chronicle', async () => {
      const lord = await studyLessonOne()
      await cancelLesson(lord)

      const response = await app.request(`/fiefs/${lord.fiefId}/events`, {
        headers: { cookie: lord.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events[0]).toEqual({
        kind: 'lessonCancelled',
        lessonId: 'lesson-1',
        occurredAt: lessonStartsAt,
      })
    })

    it('refuses a cancel with no lesson under study with the shipped study line', async () => {
      const lord = await studyLessonOne()
      await cancelLesson(lord)

      expect(await refusalOf(await cancelLesson(lord))).toEqual({
        status: 409,
        body: {
          kind: 'LessonStudyNotFound',
        },
      })
    })
  })

  describe('the lesson finish', () => {
    it('enters the five cards due at the finish on the first read after it', async () => {
      const lord = await studyLessonOne()
      clock.setTo('2026-11-10T09:01:00Z')

      const { reviews, study } = await readFief(lord)

      expect(study).toEqual({ kind: 'idle' })
      expect(dueWordsOf(reviews.due)).toEqual(
        wordIds.map((wordId) => `${wordId} recognition ${lessonFinishesAt}`),
      )
    })

    it('enters the five cards when a mutation resolves the finish', async () => {
      const lord = await studyLessonOne()
      clock.setTo('2026-11-10T09:01:00Z')

      const response = await post(lord, '/upgrades', { building: 'sawmill' })

      const { reviews } = FiefOverviewSchema.parse(await response.json())
      expect(reviews.due).toHaveLength(5)
    })

    it('enters no card before the finish', async () => {
      const lord = await studyLessonOne()
      clock.setTo('2026-11-10T08:59:59Z')

      const { reviews, lessons } = await readFief(lord)

      expect([reviews, lessons[0]?.isStudied]).toEqual([{ due: [], nextDueAt: null }, false])
    })

    it('records the lesson learned on the chronicle', async () => {
      const lord = await studyLessonOne()
      clock.setTo('2026-11-10T09:01:00Z')

      const response = await app.request(`/fiefs/${lord.fiefId}/events`, {
        headers: { cookie: lord.cookie },
      })

      expect(FiefChronicleSchema.parse(await response.json()).events[0]).toEqual({
        kind: 'lessonLearned',
        lessonId: 'lesson-1',
        occurredAt: lessonFinishesAt,
      })
    })
  })

  describe('the due reviews', () => {
    it('shows a recognition with its word, its frame and the glosses of the lesson', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      const { reviews } = await readFief(lord)

      const recognition = reviews.due.find(({ wordId }) => wordId === 'lesson-1-2')
      assert(recognition?.mode === 'recognition')
      expect([recognition.word, recognition.frame]).toEqual([
        'school',
        'I walk to school every day.',
      ])
      expect(recognition.choices.map(({ gloss }) => gloss).sort()).toEqual([
        'comida',
        'dinero',
        'escuela',
        'hogar',
        'trabajar',
      ])
    })

    it('names the right choice of a recognition by an id no other field of the card holds', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const { reviews } = await readFief(lord)

      const leaks = reviews.due.flatMap((recognition) => {
        assert(recognition.mode === 'recognition')
        const rightChoiceId = choiceIdOf(recognition, recognition.wordId)
        const { choices, ...card } = recognition
        const fields = [...stringsIn(card), ...choices.map(({ gloss }) => gloss)]
        return fields.filter((field) => field === rightChoiceId)
      })

      expect([reviews.due.length, leaks]).toEqual([5, []])
    })

    it('rates the right choice of a recognition correct', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(lord, 'lesson-1-2')

      const { verdict } = await answered(lord, 'lesson-1-2', choiceIdOf(recognition, 'lesson-1-2'))

      expect(verdict).toEqual({
        kind: 'correct',
        word: 'school',
        gloss: 'escuela',
        dueAt: secondLearningStepAt,
        earnedSkill: null,
      })
    })

    it('answers the next due instant when nothing is due', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      await recognizeEvery(lord)

      const { reviews } = await readFief(lord)

      expect(reviews).toEqual({ due: [], nextDueAt: secondLearningStepAt })
    })

    it('shows a recall with its gloss and its gapped frame and never its word', async () => {
      const lord = await studyToTheFirstRecall()

      const response = await app.request(`/fiefs/${lord.fiefId}`, {
        headers: { cookie: lord.cookie },
      })

      const body = await response.text()
      const { reviews } = FiefOverviewSchema.parse(JSON.parse(body))
      const recalls = reviews.due.filter((review) => review.mode === 'recall')
      expect(recalls.find(({ wordId }) => wordId === 'lesson-1-2')).toEqual({
        mode: 'recall',
        wordId: 'lesson-1-2',
        lessonId: 'lesson-1',
        dueAt: firstRecallAt,
        gloss: 'escuela',
        gappedFrame: 'I walk to ____ every day.',
      })
      expect(recalls).toHaveLength(5)
      expect(wordIds.filter((wordId) => JSON.stringify(reviews).includes(lemmaOf(wordId)))).toEqual(
        [],
      )
      expect(['home', 'school', 'work', 'money'].filter((lemma) => body.includes(lemma))).toEqual(
        [],
      )
    })
  })

  describe('the fief read', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('reads a developed fief and its five cards in one statement that answers one row', async () => {
      const lord = await studyToTheFirstRecall()
      await runSql('UPDATE fiefs SET wood = 900, stone = 900, iron = 900')
      for (const building of ['sawmill', 'quarry', 'farm']) {
        expect((await post(lord, '/upgrades', { building })).status).toBe(200)
      }
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, kind::unit, 1 FROM fiefs, unnest(ARRAY['infantry', 'cavalry']) AS kind`)
      const rowCounts: Array<number> = []
      const query = Pool.prototype.query
      vi.spyOn(Pool.prototype, 'query').mockImplementation(function (
        this: Pool,
        ...parameters: Parameters<typeof query>
      ) {
        const result: unknown = Reflect.apply(query, this, parameters)
        if (statementTextOf(parameters[0]).includes('from "fiefs"')) {
          Promise.resolve(result).then(
            (answered) => {
              if (typeof answered === 'object' && answered !== null && 'rows' in answered) {
                rowCounts.push(Array.isArray(answered.rows) ? answered.rows.length : -1)
              }
            },
            () => undefined,
          )
        }
        return result
      })

      const { reviews, queue, units } = await readFief(lord)

      expect([rowCounts, reviews.due.length, queue.entries.length, units.infantry]).toEqual([
        [1],
        5,
        2,
        1,
      ])
    })
  })

  describe('the hint route', () => {
    it('answers the first letter and the letter count of a due recall', async () => {
      const lord = await studyToTheFirstRecall()

      const response = await hint(lord, 'lesson-1-2')

      expect(response.status).toBe(200)
      expect(ReviewHintSchema.parse(await response.json())).toEqual({
        firstLetter: 's',
        letterCount: 6,
      })
    })

    it('rates the answer after a hint Hard, due 8 days later', async () => {
      const lord = await studyToTheFirstRecall()
      await hint(lord, 'lesson-1-2')

      const { verdict } = await answered(lord, 'lesson-1-2', 'school')

      expect(verdict).toEqual({
        kind: 'correct',
        word: 'school',
        gloss: 'escuela',
        dueAt: '2026-11-20T09:10:00.000Z',
        earnedSkill: null,
      })
    })

    it('refuses a hint on a recognition', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await hint(lord, 'lesson-1-2'))).toEqual({
        status: 409,
        body: {
          kind: 'HintOnRecognition',
        },
      })
    })

    it('refuses a hint on a card not yet due', async () => {
      const lord = await studyToTheFirstRecall()
      clock.setTo('2026-11-12T09:09:59Z')

      expect(await refusalOf(await hint(lord, 'lesson-1-2'))).toEqual({
        status: 409,
        body: {
          kind: 'ReviewNotDue',
        },
      })
    })
  })

  describe('the answer route', () => {
    it('grades a typed answer one letter off as a near-miss and rates nothing', async () => {
      const lord = await studyToTheFirstRecall()

      const nearMiss = await answered(lord, 'lesson-1-2', 'scool')

      expect(nearMiss.verdict).toEqual({ kind: 'nearMiss' })
      expect(dueWordsOf(nearMiss.fief.reviews.due)).toContain(`lesson-1-2 recall ${firstRecallAt}`)
    })

    it('rates the right answer after a near-miss Hard', async () => {
      const lord = await studyToTheFirstRecall()
      await answered(lord, 'lesson-1-2', 'scool')

      const { verdict } = await answered(lord, 'lesson-1-2', 'School ')

      expect(verdict.kind === 'correct' && verdict.dueAt).toBe('2026-11-20T09:10:00.000Z')
    })

    it('answers a wrong answer with the correct form, due again at the relearning step', async () => {
      const lord = await studyToTheFirstRecall()

      const { verdict } = await answered(lord, 'lesson-1-1', 'house')

      expect(verdict).toEqual({
        kind: 'wrong',
        word: 'home',
        gloss: 'hogar',
        dueAt: '2026-11-12T09:20:00.000Z',
      })
    })

    it('grades an empty answer wrong', async () => {
      const lord = await studyToTheFirstRecall()

      const { verdict } = await answered(lord, 'lesson-1-1', '')

      expect(verdict.kind).toBe('wrong')
    })

    it('grades a recognition by the choice chosen', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(lord, 'lesson-1-5')

      const { verdict } = await answered(lord, 'lesson-1-5', choiceIdOf(recognition, 'lesson-1-4'))

      expect(verdict).toEqual({
        kind: 'wrong',
        word: 'food',
        gloss: 'comida',
        dueAt: '2026-11-10T09:01:00.000Z',
      })
    })

    it('refuses a recognition answer that is none of its choice ids and rates nothing', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      const refusal = await refusalOf(await answer(lord, 'lesson-1-5', 'lesson-1-5'))

      expect(refusal).toEqual({
        status: 409,
        body: {
          kind: 'UnknownChoice',
        },
      })
      expect(dueWordsOf((await readFief(lord)).reviews.due)).toContain(
        `lesson-1-5 recognition ${lessonFinishesAt}`,
      )
    })

    it('refuses a word the player holds no card of', async () => {
      const lord = await signUpWithALibrary()

      expect(await refusalOf(await answer(lord, 'lesson-1-1', 'home'))).toEqual({
        status: 409,
        body: {
          kind: 'WordNotHeld',
        },
      })
    })

    it('refuses a word no lesson holds', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await answer(lord, 'home', 'home'))).toEqual({
        status: 409,
        body: {
          kind: 'UnknownWord',
        },
      })
    })

    it('refuses an answer to a card not yet due', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(lord, 'lesson-1-1')
      await answered(lord, 'lesson-1-1', choiceIdOf(recognition, 'lesson-1-1'))
      clock.setTo('2026-11-10T09:05:00Z')

      expect(await refusalOf(await answer(lord, 'lesson-1-1', 'home'))).toEqual({
        status: 409,
        body: {
          kind: 'ReviewNotDue',
        },
      })
    })

    it('answers 400 for an answer above 100 characters', async () => {
      const lord = await studyToTheFirstRecall()

      const response = await answer(lord, 'lesson-1-1', 'h'.repeat(101))

      expect(response.status).toBe(400)
    })
  })

  describe('lesson 1 from its study to its skill', () => {
    it('steps every card as the worked example of ADR 036 does, the first recall answered late', async () => {
      const lord = await studyLessonOne()
      clock.setTo(lessonFinishesAt)
      const firstRead = await readFief(lord)
      const firstRecognitions = await recognizeEvery(lord)
      clock.setTo(secondLearningStepAt)
      const secondRecognitions = await recognizeEvery(lord)
      clock.setTo(firstRecallAt)
      const recallRead = await readFief(lord)
      clock.setTo(lateFirstRecallAt)
      const firstRecalls = await answerEvery(lord, lemmaOf)

      expect(dueWordsOf(firstRead.reviews.due)).toEqual(
        wordIds.map((wordId) => `${wordId} recognition ${lessonFinishesAt}`),
      )
      expect(dueAtsOf(firstRecognitions)).toEqual(wordIds.map(() => secondLearningStepAt))
      expect(dueAtsOf(secondRecognitions)).toEqual(wordIds.map(() => firstRecallAt))
      expect(dueWordsOf(recallRead.reviews.due)).toEqual(
        wordIds.map((wordId) => `${wordId} recall ${firstRecallAt}`),
      )
      expect(dueAtsOf(firstRecalls)).toEqual(wordIds.map(() => secondRecallAt))
    })

    it('earns no skill before the second recall of the last word', async () => {
      const lord = await studyToTheSecondRecall()
      const earlierAnswers: Array<ReviewAnswer> = []
      for (const wordId of wordIds.slice(0, 4)) {
        earlierAnswers.push(await answered(lord, wordId, lemmaOf(wordId)))
      }

      const { skills, lessons } = await readFief(lord)

      expect(
        earlierAnswers.map(({ verdict }) => verdict.kind === 'correct' && verdict.earnedSkill),
      ).toEqual([null, null, null, null])
      expect(skills).toEqual([])
      expect(lessons[0]?.words.map(({ isRetained }) => isRetained)).toEqual([
        true,
        true,
        true,
        true,
        false,
      ])
    })

    it('earns the food skill at the second recall, 13 days after the lesson', async () => {
      const lord = await studyToTheSecondRecall()
      for (const wordId of wordIds.slice(0, 4)) {
        await answered(lord, wordId, lemmaOf(wordId))
      }

      const { verdict, fief } = await answered(lord, 'lesson-1-5', 'food')

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
          ratePerHourBefore: 11.25,
          ratePerHourAfter: 11.8125,
        },
      })
      expect([fief.skills, fief.resources.food.ratePerHour]).toEqual([
        [{ lessonId: 'lesson-1', resource: 'food', ratePercent: 5, earnedAt: secondRecallAt }],
        11.8125,
      ])
    })
  })

  describe('a fief founded before the earn', () => {
    const freePlotOfProvinceTwo = (): number => {
      const { camps } = server.buildingCatalog.fiefSettings()
      const plot = Array.from({ length: 15 }, (_, index) => index + 1).find(
        (candidate) => campOf({ kingdom: 1, province: 2, plot: candidate }, camps) === undefined,
      )
      assert(plot !== undefined)
      return plot
    }

    it('accrues the base rate until the earn and the raised rate only after it', async () => {
      const lord = await studyToTheSecondRecall()
      for (const wordId of wordIds.slice(0, 4)) {
        await answered(lord, wordId, lemmaOf(wordId))
      }
      await runSql(`INSERT INTO fief_units (fief_id, kind, count)
        SELECT id, 'settler'::unit, 1 FROM fiefs`)
      const sent = await post(lord, '/marches/found', {
        province: 2,
        plot: freePlotOfProvinceTwo(),
        name: 'Sotoverde',
      })
      const { march } = FiefOverviewSchema.parse(await sent.json())
      assert(march !== null)
      const earnedAt = '2026-11-23T21:00:00.000Z'
      clock.setTo(earnedAt)

      const { verdict } = await answered(lord, 'lesson-1-5', 'food')

      expect(verdict.kind === 'correct' && verdict.earnedSkill?.earnedAt).toBe(earnedAt)
      const listed = await app.request('/fiefs', { headers: { cookie: lord.cookie } })
      const founded = FiefListSchema.parse(await listed.json()).fiefs.find(
        ({ id }) => id !== lord.fiefId,
      )
      assert(founded !== undefined)
      const { resources, skills } = await readFief({ cookie: lord.cookie, fiefId: founded.id })
      const hoursAtTheBaseRate =
        (Date.parse(earnedAt) - Date.parse(march.arrivesAt)) / (60 * 60 * 1000)
      expect(skills.map((skill) => skill.earnedAt)).toEqual([earnedAt])
      expect([resources.food.amount, resources.food.ratePerHour]).toEqual([
        Math.floor(300 + 7.5 * hoursAtTheBaseRate),
        7.875,
      ])
    })
  })
})

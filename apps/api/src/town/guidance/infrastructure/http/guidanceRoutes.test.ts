import { ReviewsSchema } from '@mygame/contracts'
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
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  jsonRequest,
  type MovableClock,
  movableClock,
  overviewOf,
  refusalOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
  withNoLessons,
} from '../../../infrastructure/http/townRoutes.testSupport'

describe('the town route', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: TownApp

  beforeAll(() => {
    server = townServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const { signUp, foundTown, signUpWithTown, readTown, startWork, startLesson, stopLesson } =
    townRequests(() => app)

  describe('the next step', () => {
    const lessonMinutes = 6

    it('sends a founded town to lesson 1', async () => {
      const cookie = await signUp('ana@example.com')

      const founded = await overviewOf(await foundTown(cookie, { name: 'Maple Falls' }))

      expect(founded.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
    })

    it('answers no next review before a card enters', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      expect((await overviewOf(await readTown(cookie))).nextDueAt).toBeNull()
    })

    it('reads the town of a running lesson that left the curriculum', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      const emptied = createApp({
        ...server,
        clock,
        lessons: withNoLessons(server.lessons),
      })

      const read = await emptied.request('/town', { headers: { cookie } })

      expect((await overviewOf(read)).nextStep.kind).toBe('lessonRunning')
    })

    it('goes back to the lesson in the answer to a lesson stop', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')

      const stopped = await overviewOf(await stopLesson(cookie, 'lesson-1'))

      expect(stopped.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
    })

    it('answers the finished lesson as reviews, its words to read first', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      clock.advanceMinutes(lessonMinutes)

      const finished = await overviewOf(await readTown(cookie))

      expect(finished.nextStep).toEqual({ kind: 'reviews', count: 5, readFirst: ['lesson-1'] })
    })

    it('answers the next review once the due cards are answered', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startLesson(cookie, 'lesson-1')
      clock.advanceMinutes(lessonMinutes)
      await readTown(cookie)
      const firstReviewAt = clock.now().epochMilliseconds
      const reviews = ReviewsSchema.parse(
        await (await app.request('/reviews', { headers: { cookie } })).json(),
      )
      for (const review of reviews.due) {
        assert(review.mode === 'recognition')
        const [choice] = review.choices
        assert(choice !== undefined)
        await app.request(
          `/reviews/${review.wordId}/answer`,
          jsonRequest('POST', cookie, { answer: choice.choiceId }),
        )
      }

      const answered = await overviewOf(await readTown(cookie))

      assert(answered.nextDueAt !== null)
      expect(answered.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-2' })
      expect(Date.parse(answered.nextDueAt)).toBeGreaterThan(firstReviewAt)
    })
  })

  describe('the guidance', () => {
    const readCaughtUp = (cookie: string): Promise<Response> =>
      Promise.resolve(
        createApp({
          ...server,
          clock,
          lessons: withNoLessons(server.lessons),
        }).request('/town', { headers: { cookie } }),
      )

    const markTipSeen = (cookie: string, tip: string): Promise<Response> =>
      Promise.resolve(app.request(`/town/tips/${tip}`, { method: 'POST', headers: { cookie } }))

    const dismissGuidance = (cookie: string): Promise<Response> =>
      Promise.resolve(
        app.request('/town/guidance/dismissal', { method: 'POST', headers: { cookie } }),
      )

    it('answers the next goal when caught up and none beside a lesson to study', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const studying = await overviewOf(await readTown(cookie))
      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(studying.nextStep).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
      expect(caughtUp.nextStep).toEqual({
        kind: 'caughtUp',
        reason: 'lessonsDone',
        goal: {
          position: 1,
          count: 9,
          building: 'farm',
          level: 1,
          state: 'pending',
          missing: { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 },
        },
        text: null,
      })
    })

    it('answers the goal underway while its level is being built', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startWork(cookie, 'farm')

      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(caughtUp.nextStep).toEqual({
        kind: 'caughtUp',
        reason: 'lessonsDone',
        goal: { position: 1, count: 9, building: 'farm', level: 1, state: 'underway' },
        text: null,
      })
    })

    it("a new town's third goal is school level 2", async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startWork(cookie, 'farm')
      await startWork(cookie, 'factory')
      clock.advanceMinutes(4)

      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(caughtUp.nextStep).toEqual({
        kind: 'caughtUp',
        reason: 'lessonsDone',
        goal: {
          position: 3,
          count: 9,
          building: 'school',
          level: 2,
          state: 'pending',
          missing: { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 },
        },
        text: null,
      })
    })

    it('answers caughtUp with learningCap when the cap is full', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'filler-' || n, 'review', 3, 5, '2026-11-05T08:00:00Z', 'good', '2026-11-01T08:00:00Z'
        FROM players, generate_series(1, 15) AS n WHERE email = 'ana@example.com'`)

      const town = await overviewOf(await readTown(cookie))

      expect(town.nextStep).toEqual({
        kind: 'caughtUp',
        reason: 'learningCap',
        goal: {
          position: 1,
          count: 9,
          building: 'farm',
          level: 1,
          state: 'pending',
          missing: { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 },
        },
        text: null,
      })
    })

    it('answers when the next word in learning is due', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'filler-' || n, 'review', 3, 5, TIMESTAMPTZ '2026-11-04T08:00:00Z' + n * INTERVAL '1 hour', 'good', '2026-11-01T08:00:00Z'
        FROM players, generate_series(1, 15) AS n WHERE email = 'ana@example.com'`)
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'stable', 'review', 10, 5, '2026-10-27T08:00:00Z', 'good', '2026-10-01T08:00:00Z'
        FROM players WHERE email = 'ana@example.com'`)

      const town = await overviewOf(await readTown(cookie))

      expect({
        reason: town.nextStep.kind === 'caughtUp' ? town.nextStep.reason : null,
        nextDueAt: town.nextDueAt,
        nextInLearningDueAt: town.learning.nextInLearningDueAt,
      }).toEqual({
        reason: 'learningCap',
        nextDueAt: '2026-11-06T08:00:00.000Z',
        nextInLearningDueAt: '2026-11-07T09:00:00.000Z',
      })
    })

    it('answers null when no card is in learning', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'stable', 'review', 10, 5, '2026-10-27T08:00:00Z', 'good', '2026-10-01T08:00:00Z'
        FROM players WHERE email = 'ana@example.com'`)

      const town = await overviewOf(await readTown(cookie))

      expect(town.learning.nextInLearningDueAt).toBeNull()
    })

    it('a running lesson carries the next goal', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const started = await overviewOf(await startLesson(cookie, 'lesson-1'))

      expect(started.nextStep).toEqual({
        kind: 'lessonRunning',
        goal: {
          position: 1,
          count: 9,
          building: 'farm',
          level: 1,
          state: 'pending',
          missing: { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 },
        },
        text: null,
      })
    })

    it('a running lesson carries no goal once the guidance is dismissed', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await dismissGuidance(cookie)

      const started = await overviewOf(await startLesson(cookie, 'lesson-1'))

      expect(started.nextStep).toEqual({ kind: 'lessonRunning', goal: null, text: null })
    })

    it('dismisses the guidance', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const dismissal = await dismissGuidance(cookie)
      const caughtUp = await overviewOf(await readCaughtUp(cookie))

      expect(dismissal.status).toBe(204)
      expect(caughtUp.nextStep).toEqual({
        kind: 'caughtUp',
        reason: 'lessonsDone',
        goal: null,
        text: null,
      })
    })

    it('refuses to dismiss the guidance of a player with no town as TownNotFound', async () => {
      const cookie = await signUp('ana@example.com')

      const response = await dismissGuidance(cookie)

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })

    it('answers no tip while no concept matters', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      expect((await overviewOf(await readTown(cookie))).tip).toBeNull()
    })

    it('answers the tip of a concept that matters', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const started = await overviewOf(await startWork(cookie, 'farm'))

      expect(started.tip).toBe('waitingList')
    })

    it('marks a tip seen once', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await startWork(cookie, 'farm')

      const statuses = [
        (await markTipSeen(cookie, 'waitingList')).status,
        (await markTipSeen(cookie, 'waitingList')).status,
      ]
      const read = await overviewOf(await readTown(cookie))

      expect(statuses).toEqual([204, 204])
      expect(read.tip).toBeNull()
    })

    it('answers an unknown tip with an empty 400', async () => {
      const cookie = await signUpWithTown('ana@example.com')

      const response = await markTipSeen(cookie, 'peasants')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })
  })
})

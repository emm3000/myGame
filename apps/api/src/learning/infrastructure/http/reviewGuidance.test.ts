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
import {
  jsonRequest,
  type MovableClock,
  movableClock,
  overviewOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
} from '#town/infrastructure/http/townRoutes.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

describe('the guidance the reviews drive', () => {
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

  const { signUpWithTown, readTown, startLesson } = townRequests(() => app)

  describe('the next step', () => {
    const lessonMinutes = 6

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
  })
})

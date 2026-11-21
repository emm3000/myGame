import { describe, expect, it } from 'vitest'
import {
  learningWorld,
  lessonFinishesAt,
  lessonStartsAt,
  overviewOf,
  refusalOf,
  runSql,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { signUpWithATown, readTown, startLesson } = world

  describe('the learning cap', () => {
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
        nextInLearningDueAt: '2026-11-10T07:00:00.000Z',
      })
    })

    it('starts a lesson while cards from 4 to under 7 days would have filled the cap', async () => {
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'settling-' || n, 'review', 4 + n * 0.29, 5, '2026-11-09T07:00:00Z', 'good', '2026-11-01T07:00:00Z'
        FROM players, generate_series(0, 10) AS n`)

      expect((await overviewOf(await startLesson(player))).lessonSlot).toEqual({
        lessonId: 'lesson-1',
        startedAt: lessonStartsAt,
        finishesAt: lessonFinishesAt,
      })
    })

    it('leaves a card out of the cards in learning from a stability of 4 days', async () => {
      const player = await signUpWithATown()
      await runSql(`INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at)
        SELECT id, 'steady-' || n, 'review', 3 + n, 5, '2026-11-09T07:00:00Z', 'good', '2026-11-01T07:00:00Z'
        FROM players, generate_series(0, 1) AS n`)

      expect((await readTown(player)).learning).toEqual({
        cap: 15,
        inLearning: 1,
        retainedWords: null,
        nextInLearningDueAt: '2026-11-12T07:00:00.000Z',
      })
    })
  })
})

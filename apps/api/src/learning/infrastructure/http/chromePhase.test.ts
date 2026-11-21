import { PlayerSchema } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { shippedCurriculum } from '#content/infrastructure/json/shippedCurriculum.testSupport'
import {
  firstRecallAt,
  lateFirstRecallAt,
  learningWorld,
  lessonFinishesAt,
  lessonStartsAt,
  type Player,
  runSql,
  secondRecallAt,
  seedLessonOneStudied,
  wordIds,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { send, signUpWithATown, readTown, startLesson, answered } = world

  describe('the chrome phase', () => {
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
      const laterChromeLessons = world.server.lessons.chromeLessons().slice(1)
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
         SELECT players.id, word_id, 'review', NULL, 9.5, 4.2, '${lessonStartsAt}', 'good', '${lessonStartsAt}'
         FROM players, unnest(ARRAY['${laterChromeLessons.map(({ words }) => words[0]?.id).join("', '")}']) AS word_id`,
      )
      world.clock.setTo(lessonStartsAt)
      expect((await startLesson(player)).status).toBe(200)
      world.clock.setTo(firstRecallAt)

      const session = PlayerSchema.parse(await (await send(player, 'GET', '/auth/session')).json())
      const town = await readTown(player)

      expect([session.chromePhase, town.chromePhase]).toEqual(['both', 'both'])
    })

    it('answers the chrome English on the town read right after the last chrome skill is earned', async () => {
      const player = await signUpWithATown()
      await seedLessonOneStudied()
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at, retained_at)
         SELECT players.id, word_id, 'review', NULL, 46.316858440073425, 2.0974554287524403, '${secondRecallAt}', 'good', '${lessonFinishesAt}', '${secondRecallAt}'
         FROM players, unnest(ARRAY['${wordIds.slice(0, 4).join("', '")}']) AS word_id`,
      )
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
         SELECT id, 'lesson-1-5', 'review', NULL, 10.971048263078135, 2.1043313908464483, '${lateFirstRecallAt}', 'good', '${lessonFinishesAt}' FROM players`,
      )
      world.clock.setTo(secondRecallAt)
      const laterChromeLessons = world.server.lessons.chromeLessons().slice(1)
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
  })
})

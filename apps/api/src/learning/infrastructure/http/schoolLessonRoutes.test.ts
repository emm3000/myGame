import { PlayerSchema } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { shippedCurriculum } from '#content/infrastructure/json/shippedCurriculum.testSupport'
import {
  choiceIdOf,
  dueWordsOf,
  firstRecallAt,
  lateFirstRecallAt,
  learningWorld,
  lessonFinishesAt,
  lessonStartsAt,
  overviewOf,
  type Player,
  refusalOf,
  runSql,
  secondRecallAt,
  seedLessonOneStudied,
  wordIds,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const {
    send,
    signUp,
    signUpWithATown,
    readTown,
    readReviews,
    startLesson,
    stopLesson,
    answered,
    studyLessonOne,
    dueReviewOf,
    seedTheFirstRecall,
  } = world

  describe('the school lesson route', () => {
    const lessonOneGlosses = ['hogar', 'escuela', 'trabajar', 'dinero', 'comida']

    it('studies lesson 1 in the school for 300 s at school 1, costing nothing', async () => {
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
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
          skill: { resource: 'money', ratePercent: 5 },
          isStudied: false,
          words: wordIds.map((wordId, index) => ({
            wordId,
            standing: 'notStarted',
            reading: null,
            support: { shown: 'beside', text: lessonOneGlosses[index], language: 'es' },
          })),
          enteringWordCount: wordIds.length,
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
        reading: {
          word: 'school',
          frame: [{ text: 'We are at school.', support: null }],
        },
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
          frame: [{ text: 'We are at school.', support: null }],
        },
        support: { shown: 'beside', text: 'a place where children go to learn', language: 'en' },
      })
    })

    it('shows the gloss of a word on tap once its card holds for 7 days', async () => {
      const player = await seedTheFirstRecall()
      await runSql("UPDATE cards SET stability = 7 WHERE word_id = 'lesson-1-2'")

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]?.support).toEqual({
        shown: 'onTap',
        text: 'escuela',
        language: 'es',
      })
    })

    it('shows the definition of a word on tap once its card holds for 30 days', async () => {
      const player = await seedTheFirstRecall()
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

    it('answers on the town the scaffold and its version the session answers', async () => {
      const player = await signUpWithATown()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const session = PlayerSchema.parse(await (await send(player, 'GET', '/auth/session')).json())
      const town = await readTown(player)

      expect([town.scaffold, town.scaffoldVersion]).toEqual([
        session.scaffold,
        session.scaffoldVersion,
      ])
    })

    it('answers on the town the scaffold of the last change', async () => {
      const player = await signUpWithATown()

      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      expect((await readTown(player)).scaffold).toBe('none')
    })

    it('answers the chrome English to a player under none', async () => {
      const player = await signUpWithATown()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      expect((await readTown(player)).chromePhase).toBe('english')
    })

    it("reads a finished lesson's word until its first review", async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
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

    it('refuses lesson 1 while the school studies it', async () => {
      const player = await studyLessonOne()

      expect(await refusalOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonUnderStudy' },
      })
    })

    it('refuses lesson 1 once its words are in the review', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)

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
      world.clock.setTo('2026-11-10T09:01:00Z')

      const { due } = await readReviews(player)

      expect(dueWordsOf(due)).toEqual(
        wordIds.map((wordId) => `${wordId} recognition ${lessonFinishesAt}`),
      )
    })

    it('idles the school and marks the lesson studied on the first town read after it', async () => {
      const player = await studyLessonOne()
      world.clock.setTo('2026-11-10T09:01:00Z')

      const { lessonSlot, lessons } = await readTown(player)

      expect([lessonSlot, lessons[0]?.isStudied]).toEqual([null, true])
    })

    it('enters no card before the finish', async () => {
      const player = await studyLessonOne()
      world.clock.setTo('2026-11-10T08:59:59Z')

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: null })
    })
  })
})

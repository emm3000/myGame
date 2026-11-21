import { assert, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import {
  choiceIdOf,
  dueAtsOf,
  dueWordsOf,
  firstRecallAt,
  lateFirstRecallAt,
  learningWorld,
  lemmaOf,
  lessonFinishesAt,
  overviewOf,
  pausingFirstTransaction,
  refusalOf,
  runSql,
  secondLearningStepAt,
  secondRecallAt,
  signal,
  untilPlayerBlockedOrAnswered,
  wordIds,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const {
    send,
    signUpWithATown,
    readTown,
    readReviews,
    answer,
    answered,
    studyLessonOne,
    answerEvery,
    dueReviewOf,
    recognizeEvery,
    seedTheFirstRecall,
    studyToTheLastSecondRecall,
  } = world

  describe('the answer route', () => {
    it('grades a typed answer one letter off as a near-miss and rates nothing', async () => {
      const player = await seedTheFirstRecall()

      const nearMiss = await answered(player, 'lesson-1-2', 'scool')

      expect(nearMiss).toEqual({ verdict: { kind: 'nearMiss' } })
      expect(dueWordsOf((await readReviews(player)).due)).toContain(
        `lesson-1-2 recall ${firstRecallAt}`,
      )
    })

    it('rates the right answer after a near-miss Hard', async () => {
      const player = await seedTheFirstRecall()
      await answered(player, 'lesson-1-2', 'scool')

      const { verdict } = await answered(player, 'lesson-1-2', 'School ')

      expect(verdict.kind === 'correct' && verdict.dueAt).toBe('2026-11-20T09:10:00.000Z')
    })

    it('answers a wrong answer with the correct form, due again at the relearning step', async () => {
      const player = await seedTheFirstRecall()

      const { verdict } = await answered(player, 'lesson-1-1', 'house')

      expect(verdict).toEqual({
        kind: 'wrong',
        word: 'home',
        gloss: 'hogar',
        dueAt: '2026-11-12T09:20:00.000Z',
        stableWordCount: 0,
        retainedWordCount: 0,
        openedLevel: null,
      })
    })

    it('answers a wrong answer under none with the definition beside the correct form', async () => {
      const player = await seedTheFirstRecall()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const { verdict } = await answered(player, 'lesson-1-1', 'house')

      assert(verdict.kind === 'wrong')
      expect([verdict.word, verdict.gloss]).toEqual(['home', 'the place where you live'])
    })

    it('grades an empty answer wrong', async () => {
      const player = await seedTheFirstRecall()

      const { verdict } = await answered(player, 'lesson-1-1', '')

      expect(verdict.kind).toBe('wrong')
    })

    it('grades a recognition by the choice chosen', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
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
        stableWordCount: 0,
        retainedWordCount: 0,
        openedLevel: null,
      })
    })

    it('refuses a recognition answer that is none of its choice ids and rates nothing', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)

      const refusal = await refusalOf(await answer(player, 'lesson-1-5', 'lesson-1-5'))

      expect(refusal).toEqual({ status: 409, body: { kind: 'UnknownChoice' } })
      expect(dueWordsOf((await readReviews(player)).due)).toContain(
        `lesson-1-5 recognition ${lessonFinishesAt}`,
      )
    })

    it('serializes two concurrent answers to one card of a player with no town', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(player, 'lesson-1-2')
      await runSql('DELETE FROM towns')
      const firstHasRead = signal()
      const secondHasAnswered = signal()
      const secondIsBlockedOrHasAnswered = untilPlayerBlockedOrAnswered(secondHasAnswered.promise)
      const racingApp = createApp({
        ...world.server,
        clock: world.clock,
        inTransaction: pausingFirstTransaction(world.server.inTransaction, async () => {
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
      world.clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await answer(player, 'home', 'home'))).toEqual({
        status: 409,
        body: { kind: 'UnknownWord' },
      })
    })

    it('refuses an answer to a card not yet due', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const recognition = await dueReviewOf(player, 'lesson-1-1')
      await answered(player, 'lesson-1-1', choiceIdOf(recognition, 'lesson-1-1'))
      world.clock.setTo('2026-11-10T09:05:00Z')

      expect(await refusalOf(await answer(player, 'lesson-1-1', 'home'))).toEqual({
        status: 409,
        body: { kind: 'ReviewNotDue' },
      })
    })

    it('opens level 3 at the recall that makes the 10th word stable', async () => {
      const player = await seedTheFirstRecall()
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at) SELECT id, 'stable-' || n, 'review', 12, 5, '2026-11-01T08:00:00Z', 'good', '2026-11-01T07:00:00Z' FROM players, generate_series(1, 5) n`,
      )

      const recalls = await answerEvery(player, lemmaOf)

      expect(
        recalls.map(({ verdict }) =>
          verdict.kind === 'nearMiss'
            ? undefined
            : [verdict.stableWordCount, verdict.retainedWordCount, verdict.openedLevel],
        ),
      ).toEqual([
        [6, 0, null],
        [7, 0, null],
        [8, 0, null],
        [9, 0, null],
        [10, 0, 3],
      ])
    })

    it('answers 400 for an answer above 100 characters', async () => {
      const player = await seedTheFirstRecall()

      const response = await answer(player, 'lesson-1-1', 'h'.repeat(101))

      expect(response.status).toBe(400)
    })
  })

  describe('lesson 1 from its study to its skill', () => {
    it('steps every card as the worked example of ADR 036 does, the first recall answered late', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const firstRead = await readReviews(player)
      const firstRecognitions = await recognizeEvery(player)
      world.clock.setTo(secondLearningStepAt)
      const secondRecognitions = await recognizeEvery(player)
      world.clock.setTo(firstRecallAt)
      const recallRead = await readReviews(player)
      world.clock.setTo(lateFirstRecallAt)
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

    it("earns the money skill at the second recall with the town's rates before and after", async () => {
      const player = await studyToTheLastSecondRecall()
      const before = await readTown(player)

      const { verdict } = await answered(player, 'lesson-1-5', 'food')

      const after = await readTown(player)
      expect(verdict).toEqual({
        kind: 'correct',
        word: 'food',
        gloss: 'comida',
        dueAt: '2027-01-08T15:00:00.000Z',
        stableWordCount: 5,
        retainedWordCount: 5,
        openedLevel: null,
        earnedSkill: {
          lessonId: 'lesson-1',
          resource: 'money',
          ratePercent: 5,
          earnedAt: secondRecallAt,
          level: 1,
          ratePerHourBefore: before.stocks.money.ratePerHour,
          ratePerHourAfter: after.stocks.money.ratePerHour,
          words: ['home', 'school', 'work', 'money', 'food'],
        },
      })
      expect(after.stocks.money.ratePerHour).toBeGreaterThan(before.stocks.money.ratePerHour)
    })

    it('carries the earned skill on the town overview', async () => {
      const player = await studyToTheLastSecondRecall()

      await answered(player, 'lesson-1-5', 'food')

      expect((await readTown(player)).skills).toEqual([
        { lessonId: 'lesson-1', resource: 'money', ratePercent: 5, earnedAt: secondRecallAt },
      ])
    })

    it('keeps the food skill a lesson earned before every skill raised money', async () => {
      const player = await signUpWithATown()
      await runSql(
        "INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at) SELECT id, 'lesson-1', 'food', 5, '2026-11-02T09:00:00.000Z' FROM players",
      )

      expect((await readTown(player)).skills).toEqual([
        {
          lessonId: 'lesson-1',
          resource: 'food',
          ratePercent: 5,
          earnedAt: '2026-11-02T09:00:00.000Z',
        },
      ])
    })

    it('earns the skill with no rates for a player whose town is gone', async () => {
      const player = await studyToTheLastSecondRecall()
      await runSql('DELETE FROM towns')

      const { verdict } = await answered(player, 'lesson-1-5', 'food')

      expect(verdict.kind === 'correct' && verdict.earnedSkill).toEqual({
        lessonId: 'lesson-1',
        resource: 'money',
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
})

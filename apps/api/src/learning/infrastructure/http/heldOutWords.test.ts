import { type ReviewAnswer, type TownOverview, TownOverviewSchema } from '@mygame/contracts'
import type { RandomSource } from '@mygame/domain'
import { assert, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { bandLessonFixtures } from './heldOutWords.testSupport'
import {
  lateFirstRecallAt,
  learningWorld,
  lessonFinishesAt,
  lessonStartsAt,
  overviewOf,
  type Player,
  runSql,
  secondLearningStepAt,
  secondRecallAt,
  stringsIn,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { signUpWithATown, readTown, readReviews, startLesson, stopLesson, answered } = world

  describe('the holdout', () => {
    const { libraryWithBandLesson } = bandLessonFixtures(world)

    const holdingOutSayAndTheLastRanks: RandomSource = {
      sampleOf: <T>(items: ReadonlyArray<T>, count: number): ReadonlyArray<T> => {
        const others = items.filter((item) => item !== 'say').reverse()
        return [...items.filter((item) => item === 'say'), ...others].slice(0, count)
      },
    }

    beforeEach(() => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
      })
    })

    it('answers that a band has started on the start that draws it', async () => {
      const player = await signUpWithATown()

      const response = await startLesson(player, 'lesson-fixture-holdout')

      expect(TownOverviewSchema.parse(await response.json()).hasBandStarted).toBe(true)
    })

    it('never reads a held-out word', async () => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')

      const running = await readTown(player)
      world.clock.setTo(lessonFinishesAt)
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
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)

      const { lessons } = await overviewOf(await startLesson(player, 'lesson-fixture-holdout'))

      const lesson = lessons.find(({ id }) => id === 'lesson-fixture-holdout')
      expect(lesson?.words.find(({ wordId }) => wordId === 'word-say')?.reading).toBeNull()
    })

    const drawSayAndFillLearningTo = async (inLearning: number): Promise<Player> => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')
      await stopLesson(player, 'lesson-fixture-holdout')
      await runSql(`INSERT INTO cards (player_id, word_id, state, step, entered_at)
        SELECT id, 'filler-' || n, 'learning', 0, '2026-11-10T07:00:00Z' FROM players, generate_series(1, ${inLearning}) AS n`)
      return player
    }

    it('admits a start whose words entering learning fit the cap though its held-out word would not', async () => {
      const player = await drawSayAndFillLearningTo(11)
      const { learning, lessons } = await readTown(player)
      const lesson = lessons.find(({ id }) => id === 'lesson-fixture-holdout')
      assert(lesson !== undefined)
      expect(learning.inLearning + lesson.words.length).toBeGreaterThan(learning.cap)

      expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(200)
    })

    it('counts no held-out word among the words a lesson enters into learning', async () => {
      const player = await drawSayAndFillLearningTo(0)

      const { lessons } = await readTown(player)

      const lesson = lessons.find(({ id }) => id === 'lesson-fixture-holdout')
      expect(lesson?.enteringWordCount).toBe(4)
    })

    it('enters no card for a held-out word when the lesson finishes', async () => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')
      world.clock.setTo(lessonFinishesAt)

      const { due } = await readReviews(player)

      expect(due.map(({ wordId }) => wordId).sort()).toEqual([
        'word-come',
        'word-think',
        'word-time',
        'word-year',
      ])
    })

    it("leaves a held-out word out of the skill's words", async () => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
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
      world.clock.setTo(lessonFinishesAt)
      await recognizeTheBandLesson()
      world.clock.setTo(secondLearningStepAt)
      await recognizeTheBandLesson()
      world.clock.setTo(lateFirstRecallAt)
      await recallTheBandLesson()
      world.clock.setTo(secondRecallAt)

      const earned = (await recallTheBandLesson()).flatMap(({ verdict }) =>
        verdict.kind === 'correct' && verdict.earnedSkill !== null ? [verdict.earnedSkill] : [],
      )

      expect(earned.map(({ lessonId, words }) => ({ lessonId, words }))).toEqual([
        { lessonId: 'lesson-fixture-holdout', words: ['time', 'year', 'think', 'come'] },
      ])
    })

    it('offers no held-out gloss among the recognition choices', async () => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
        random: holdingOutSayAndTheLastRanks,
      })
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)
      await startLesson(player, 'lesson-fixture-holdout')
      world.clock.setTo(lessonFinishesAt)

      const { due } = await readReviews(player)

      expect(stringsIn(due)).not.toContain('gloss of say')
    })
  })
})

import { type ReviewAnswer, type TownOverview, TownOverviewSchema } from '@mygame/contracts'
import type { RandomSource } from '@mygame/domain'
import { Client, type QueryResultRow } from 'pg'
import { assert, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import type { LessonLibrary, ShelvedLesson } from '#content/application/ports/LessonLibrary'
import {
  databaseUrl,
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
    const bandLessonHeadwords = ['say', 'time', 'year', 'think', 'come']

    const bandLesson = (): ShelvedLesson => {
      const lessonOne = world.server.lessons.lessonOf('lesson-1')
      assert(lessonOne !== undefined)
      return {
        ...lessonOne,
        id: 'lesson-fixture-holdout',
        theme: 'Saying and thinking',
        words: bandLessonHeadwords.map((headword) => ({
          id: `word-${headword}`,
          acceptedForms: [headword] as const,
          gloss: `gloss of ${headword}`,
          definition: `definition of ${headword}`,
          frames: [{ frame: `They ${headword} it.`, gappedFrame: 'They ____ it.' }],
        })),
      }
    }

    const libraryWithBandLesson = (): LessonLibrary => {
      const lesson = bandLesson()
      const { lessons } = world.server
      return {
        lessonOf: (lessonId) => (lessonId === lesson.id ? lesson : lessons.lessonOf(lessonId)),
        lessonOfWord: (wordId) =>
          lesson.words.some(({ id }) => id === wordId) ? lesson : lessons.lessonOfWord(wordId),
        isHeadword: (word) => lessons.isHeadword(word),
        bandOfLesson: (lessonId) => (lessonId === lesson.id ? 1 : lessons.bandOfLesson(lessonId)),
        wordsOfBand: (band) => lessons.wordsOfBand(band),
        hasLessons: (band) => lessons.hasLessons(band),
        placementWordsOf: (band) => lessons.placementWordsOf(band),
        lessons: () => [...lessons.lessons(), lesson],
        chromeLessons: () => lessons.chromeLessons(),
        frameTokensOf: (wordId, frame) => lessons.frameTokensOf(wordId, frame),
        answerFormsOf: (wordId) => lessons.answerFormsOf(wordId),
        texts: () => lessons.texts(),
        textTokensOf: (textId, passage) => lessons.textTokensOf(textId, passage),
      }
    }

    const holdingOutSayAndTheLastRanks: RandomSource = {
      sampleOf: <T>(items: ReadonlyArray<T>, count: number): ReadonlyArray<T> => {
        const others = items.filter((item) => item !== 'say').reverse()
        return [...items.filter((item) => item === 'say'), ...others].slice(0, count)
      },
    }

    const storedRows = async <Row extends QueryResultRow>(
      statement: string,
    ): Promise<ReadonlyArray<Row>> => {
      const client = new Client({ connectionString: databaseUrl() })
      await client.connect()
      try {
        return (await client.query<Row>(statement)).rows
      } finally {
        await client.end()
      }
    }

    const heldOutCount = async (): Promise<number> => {
      const [counted] = await storedRows<{ count: number }>(
        'SELECT count(*)::int AS count FROM held_out_words',
      )
      assert(counted !== undefined)
      return counted.count
    }

    beforeEach(() => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithBandLesson(),
      })
    })

    it("stores a tenth of band 1's card words outside the chrome lessons", async () => {
      const player = await signUpWithATown()

      expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(200)

      expect(await heldOutCount()).toBe(87)
    })

    it('stores the instant of the band start', async () => {
      const player = await signUpWithATown()
      world.clock.setTo(lessonStartsAt)

      await startLesson(player, 'lesson-fixture-holdout')

      expect(await storedRows('SELECT band, started_at AS "startedAt" FROM band_starts')).toEqual([
        { band: 1, startedAt: new Date(lessonStartsAt) },
      ])
    })

    it('answers that a band has started on the start that draws it', async () => {
      const player = await signUpWithATown()

      const response = await startLesson(player, 'lesson-fixture-holdout')

      expect(TownOverviewSchema.parse(await response.json()).hasBandStarted).toBe(true)
    })

    it('draws nothing when a chrome lesson starts', async () => {
      const player = await signUpWithATown()

      await startLesson(player, 'lesson-1')

      expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
    })

    it('stores no draw for a start the busy slot refuses', async () => {
      const player = await signUpWithATown()
      await startLesson(player, 'lesson-1')

      expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(409)

      expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
    })

    it('keeps the draw when a stopped lesson starts again', async () => {
      const player = await signUpWithATown()
      await startLesson(player, 'lesson-fixture-holdout')
      const drawn = await storedRows('SELECT headword FROM held_out_words ORDER BY headword')
      await stopLesson(player, 'lesson-fixture-holdout')

      await startLesson(player, 'lesson-fixture-holdout')

      expect(await storedRows('SELECT headword FROM held_out_words ORDER BY headword')).toEqual(
        drawn,
      )
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

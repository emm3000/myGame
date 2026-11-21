import { type DueReview, ReportSchema } from '@mygame/contracts'
import { assert, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../../app'
import type { LessonLibrary, ShelvedLesson } from '../../../content/application/ports/LessonLibrary'
import {
  learningWorld,
  lessonFinishesAt,
  lessonStartsAt,
  loggedFramesOf,
  type Player,
  runSql,
  secondRecallAt,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const {
    send,
    readTown,
    answered,
    hint,
    studyLessonOne,
    dueReviewOf,
    studyToTheFirstRecall,
    seedTheFirstRecall,
  } = world

  describe('the later frames', () => {
    const laterFrameOfSchool = {
      frame: 'My school is new.',
      gappedFrame: 'My ____ is new.',
      fromLessonId: 'lesson-fixture-later',
    }

    const libraryWithALaterFrame = (): LessonLibrary => {
      const { lessons } = world.server
      const lessonOne = lessons.lessons().find(({ id }) => id === 'lesson-1')
      assert(lessonOne !== undefined)
      const variedLessonOne: ShelvedLesson = {
        ...lessonOne,
        words: lessonOne.words.map((word) =>
          word.id === 'lesson-1-2'
            ? { ...word, frames: [word.frames[0], laterFrameOfSchool] }
            : word,
        ),
      }
      const bandLesson: ShelvedLesson = {
        ...lessonOne,
        id: 'lesson-fixture-later',
        theme: 'Saying and thinking',
        words: [
          {
            id: 'word-say',
            acceptedForms: ['say'],
            gloss: 'decir',
            definition: 'to tell something with words',
            frames: [{ frame: 'They say it.', gappedFrame: 'They ____ it.' }],
          },
        ],
      }
      const shelved = [variedLessonOne, bandLesson]
      return {
        lessonOf: (lessonId) => shelved.find(({ id }) => id === lessonId),
        lessonOfWord: (wordId) =>
          shelved.find(({ words }) => words.some(({ id }) => id === wordId)),
        isHeadword: (word) => lessons.isHeadword(word),
        bandOfLesson: (lessonId) => (lessonId === bandLesson.id ? 1 : undefined),
        wordsOfBand: (band) => lessons.wordsOfBand(band),
        hasLessons: (band) => lessons.hasLessons(band),
        placementWordsOf: (band) => lessons.placementWordsOf(band),
        lessons: () => shelved,
        chromeLessons: () => lessons.chromeLessons(),
        frameTokensOf: (wordId, frame) => lessons.frameTokensOf(wordId, frame),
        answerFormsOf: (wordId) => lessons.answerFormsOf(wordId),
        texts: () => lessons.texts(),
        textTokensOf: (textId, passage) => lessons.textTokensOf(textId, passage),
      }
    }

    const placeOutOfBandOne = async (): Promise<void> => {
      await runSql(
        `INSERT INTO placements (player_id, kind, decided_at) SELECT id, 'taken', '${lessonStartsAt}' FROM players`,
      )
      await runSql(
        `INSERT INTO placement_scores (player_id, band, score, taken_at) SELECT id, 1, 29, '${lessonStartsAt}' FROM players`,
      )
    }

    const recallOfSchool = async (player: Player): Promise<DueReview> => {
      const recall = await dueReviewOf(player, 'lesson-1-2')
      assert(recall.mode === 'recall')
      return recall
    }

    beforeEach(() => {
      world.app = createApp({
        ...world.server,
        clock: world.clock,
        lessons: libraryWithALaterFrame(),
      })
    })

    it('shows the anchor in recall while the stage reaches no later frame', async () => {
      const player = await seedTheFirstRecall()

      expect(await recallOfSchool(player)).toMatchObject({
        gappedFrame: [{ text: 'We are at ____.', support: null }],
      })
    })

    it('shows a later frame in recall once the stage reaches its lesson', async () => {
      const player = await seedTheFirstRecall()
      await placeOutOfBandOne()

      expect(await recallOfSchool(player)).toMatchObject({
        gappedFrame: [{ text: 'My ____ is new.', support: null }],
      })
    })

    it('shows the Report the recall frame the reviews route shows', async () => {
      const player = await seedTheFirstRecall()
      await placeOutOfBandOne()

      const report = ReportSchema.parse(await (await send(player, 'GET', '/report')).json())

      expect(report.due.find(({ wordId }) => wordId === 'lesson-1-2')).toEqual(
        await recallOfSchool(player),
      )
    })

    it('shows the recall frame first shown again though the stage has grown since', async () => {
      const player = await seedTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()

      expect(await recallOfSchool(player)).toMatchObject({
        gappedFrame: [{ text: 'We are at ____.', support: null }],
      })
    })

    it('shows the recall frame the Report first showed though the stage has grown since', async () => {
      const player = await seedTheFirstRecall()
      await send(player, 'GET', '/report')
      await placeOutOfBandOne()

      expect(await recallOfSchool(player)).toMatchObject({
        gappedFrame: [{ text: 'We are at ____.', support: null }],
      })
    })

    it('logs the frame the recall showed though the stage admits another at the answer', async () => {
      const player = await seedTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()

      await answered(player, 'lesson-1-2', 'school')

      expect(await loggedFramesOf('lesson-1-2')).toEqual(['We are at ____.'])
    })

    it('logs the later frame a recall showed', async () => {
      const player = await seedTheFirstRecall()
      await placeOutOfBandOne()
      await recallOfSchool(player)

      await answered(player, 'lesson-1-2', 'school')

      expect(await loggedFramesOf('lesson-1-2')).toEqual(['My ____ is new.'])
    })

    it('logs the frame shown through a hint and a near-miss', async () => {
      const player = await seedTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()
      await hint(player, 'lesson-1-2')
      await answered(player, 'lesson-1-2', 'scool')

      await answered(player, 'lesson-1-2', 'school')

      expect(await loggedFramesOf('lesson-1-2')).toEqual(['We are at ____.'])
    })

    it('logs the full anchor each recognition showed', async () => {
      await studyToTheFirstRecall()

      expect(await loggedFramesOf('lesson-1-2')).toEqual(['We are at school.', 'We are at school.'])
    })

    it('chooses the recall frame anew once the review is rated', async () => {
      const player = await seedTheFirstRecall()
      await recallOfSchool(player)
      await placeOutOfBandOne()
      await answered(player, 'lesson-1-2', 'school')
      world.clock.setTo(secondRecallAt)

      expect(await recallOfSchool(player)).toMatchObject({
        gappedFrame: [{ text: 'My ____ is new.', support: null }],
      })
    })

    it('logs no frame for an answer no read showed', async () => {
      const player = await seedTheFirstRecall()

      await answered(player, 'lesson-1-2', 'school')

      expect(await loggedFramesOf('lesson-1-2')).toEqual([null])
    })

    it('shows the anchor in recognition though the stage reaches a later frame', async () => {
      const player = await studyLessonOne()
      await placeOutOfBandOne()
      world.clock.setTo(lessonFinishesAt)

      expect(await dueReviewOf(player, 'lesson-1-2')).toMatchObject({
        mode: 'recognition',
        frame: [{ text: 'We are at school.', support: null }],
      })
    })

    it('reads a word with its anchor though the stage reaches a later frame', async () => {
      const player = await studyLessonOne()
      await placeOutOfBandOne()
      world.clock.setTo(lessonFinishesAt)

      const { lessons } = await readTown(player)

      expect(lessons[0]?.words[1]?.reading).toEqual({
        word: 'school',
        frame: [{ text: 'We are at school.', support: null }],
      })
    })
  })
})

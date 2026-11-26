import { PlayerSchema } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { overviewOf, rowCountOf, runSql } from '../../../infrastructure/http/townRoutes.testSupport'
import {
  lessonFinishesAt,
  lessonStartsAt,
  refusalWithStatusOf,
  schoolWorld,
  wordIds,
} from './schoolRoutes.testSupport'

describe('the school routes', () => {
  const world = schoolWorld()
  const { send, signUp, signUpWithATown, readTown, startLesson, stopLesson, studyLessonOne } = world

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
          frame: [{ text: "We're at school.", support: null }],
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
          frame: [{ text: "We're at school.", support: null }],
        },
        support: { shown: 'beside', text: 'a place where children go to learn', language: 'en' },
      })
    })

    it('answers the chrome Spanish to a new player under es', async () => {
      const player = await signUpWithATown()

      expect((await readTown(player)).chromePhase).toBe('scaffold')
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

      expect(await refusalWithStatusOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonSchoolTooLow' },
      })
    })

    it('refuses lesson 1 while the school studies it', async () => {
      const player = await studyLessonOne()

      expect(await refusalWithStatusOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonUnderStudy' },
      })
    })

    it('refuses lesson 1 once its words are in the review', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)

      expect(await refusalWithStatusOf(await startLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonAlreadyStudied' },
      })
    })

    it('writes nothing when a start refuses', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const eventsBefore = await rowCountOf('town_events')

      const refused = await refusalWithStatusOf(await startLesson(player))

      expect([
        refused,
        await rowCountOf('cards'),
        await rowCountOf('town_lesson_slots'),
        await rowCountOf('town_events'),
      ]).toEqual([{ status: 409, body: { kind: 'LessonAlreadyStudied' } }, 0, 1, eventsBefore])
    })

    it('refuses a lesson without a town as TownNotFound', async () => {
      const player = await signUp()

      expect(await refusalWithStatusOf(await startLesson(player))).toEqual({
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

      expect(await refusalWithStatusOf(await stopLesson(player))).toEqual({
        status: 409,
        body: { kind: 'LessonStudyNotFound' },
      })
    })
  })

  describe('the lesson finish', () => {
    it('idles the school and marks the lesson studied on the first town read after it', async () => {
      const player = await studyLessonOne()
      world.clock.setTo('2026-11-10T09:01:00Z')

      const { lessonSlot, lessons } = await readTown(player)

      expect([lessonSlot, lessons[0]?.isStudied]).toEqual([null, true])
    })
  })
})

import { ReviewsSchema } from '@mygame/contracts'
import { assert, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import {
  choiceIdOf,
  firstRecallAt,
  learningWorld,
  lemmaOf,
  lessonFinishesAt,
  pausingFirstUnitOfWork,
  pendingFramesOf,
  runSql,
  secondLearningStepAt,
  signal,
  stringsIn,
  untilPlayerBlockedOrAnswered,
  wordIds,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const {
    send,
    signUp,
    readReviews,
    studyLessonOne,
    dueReviewOf,
    recognizeEvery,
    seedTheFirstRecall,
  } = world

  describe('the reviews route', () => {
    it('answers no review to a player who holds no town and no card', async () => {
      const player = await signUp()

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: null })
    })

    it('answers the instant it derived the due reviews at', async () => {
      const player = await studyLessonOne()
      world.clock.setTo('2026-11-10T09:01:00Z')

      const { readAt } = await readReviews(player)

      expect(readAt).toBe('2026-11-10T09:01:00.000Z')
    })

    it('shows a recognition with its word, its frame and the glosses of the lesson', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)

      const recognition = await dueReviewOf(player, 'lesson-1-2')

      assert(recognition.mode === 'recognition')
      expect([recognition.word, recognition.frame]).toEqual([
        'school',
        [{ text: 'We are at school.', support: null }],
      ])
      expect(recognition.choices.map(({ gloss }) => gloss).sort()).toEqual([
        'comida',
        'dinero',
        'escuela',
        'hogar',
        'trabajar',
      ])
    })

    it('names the right choice of a recognition by an id no other field of the card holds', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const { due } = await readReviews(player)

      const leaks = due.flatMap((recognition) => {
        assert(recognition.mode === 'recognition')
        const rightChoiceId = choiceIdOf(recognition, recognition.wordId)
        const { choices, ...card } = recognition
        const fields = [...stringsIn(card), ...choices.map(({ gloss }) => gloss)]
        return fields.filter((field) => field === rightChoiceId)
      })

      expect([due.length, leaks]).toEqual([5, []])
    })

    it('answers readFirst on the reviews', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const finished = await readReviews(player)
      await recognizeEvery(player)
      world.clock.setTo(secondLearningStepAt)

      const reviewed = await readReviews(player)

      expect([finished.readFirst, reviewed.readFirst]).toEqual([['lesson-1'], []])
    })

    it('answers the next due instant when nothing is due', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      await recognizeEvery(player)

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: secondLearningStepAt })
    })

    it('shows a recall with its gloss and its gapped frame and never its word', async () => {
      const player = await seedTheFirstRecall()

      const body = await (await send(player, 'GET', '/reviews')).text()

      const recalls = ReviewsSchema.parse(JSON.parse(body)).due
      expect(recalls.find(({ wordId }) => wordId === 'lesson-1-2')).toEqual({
        mode: 'recall',
        wordId: 'lesson-1-2',
        lessonId: 'lesson-1',
        dueAt: firstRecallAt,
        gloss: 'escuela',
        gappedFrame: [{ text: 'We are at ____.', support: null }],
      })
      expect(recalls.map(({ mode }) => mode)).toEqual(wordIds.map(() => 'recall'))
      expect(wordIds.filter((wordId) => body.includes(`"${lemmaOf(wordId)}"`))).toEqual([])
    })

    it('shows a recall under none with the definition as its cue', async () => {
      const player = await seedTheFirstRecall()
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const { due } = await readReviews(player)

      const recall = due.find(({ wordId }) => wordId === 'lesson-1-2')
      assert(recall?.mode === 'recall')
      expect(recall.gloss).toBe('a place where children go to learn')
    })

    it('offers the definitions of the lesson as the choices of a recognition under none', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      await send(player, 'PUT', '/player/scaffold', { scaffold: 'none' })

      const recognition = await dueReviewOf(player, 'lesson-1-2')

      assert(recognition.mode === 'recognition')
      expect(recognition.choices.map(({ gloss }) => gloss).sort()).toEqual([
        'a place where children go to learn',
        'the place where you live',
        'to do a job for money',
        'what people and animals eat',
        'what you pay with to buy things',
      ])
    })

    it('reads the reviews of a player whose town is gone', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      await readReviews(player)
      await runSql('DELETE FROM towns')

      expect((await readReviews(player)).due).toHaveLength(5)
    })

    it('stores one frame for two concurrent reads of one due card', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)
      const firstHasRead = signal()
      const secondHasAnswered = signal()
      const secondIsBlockedOrHasAnswered = untilPlayerBlockedOrAnswered(secondHasAnswered.promise)
      const racingApp = createApp({
        ...world.server,
        clock: world.clock,
        unitOfWork: pausingFirstUnitOfWork(world.server.unitOfWork, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasAnswered
        }),
      })
      const readDue = (): Promise<Response> =>
        Promise.resolve(racingApp.request('/reviews', { headers: { cookie: player.cookie } }))

      const first = readDue()
      await firstHasRead.promise
      const second = readDue().then((response) => {
        secondHasAnswered.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      expect(statuses).toEqual([200, 200])
      expect(await pendingFramesOf('lesson-1-2')).toEqual(['We are at school.'])
    })
  })
})

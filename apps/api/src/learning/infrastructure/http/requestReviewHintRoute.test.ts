import { ReviewHintSchema } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { learningWorld, lessonFinishesAt, refusalOf } from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { answered, hint, studyLessonOne, seedTheFirstRecall } = world

  describe('the hint route', () => {
    it('answers the first letter and the letter count of each word of a due recall', async () => {
      const player = await seedTheFirstRecall()

      const response = await hint(player, 'lesson-1-2')

      expect(response.status).toBe(200)
      expect(ReviewHintSchema.parse(await response.json())).toEqual({
        words: [{ firstLetter: 's', letterCount: 6 }],
      })
    })

    it('rates the answer after a hint Hard, due 8 days later', async () => {
      const player = await seedTheFirstRecall()
      await hint(player, 'lesson-1-2')

      const { verdict } = await answered(player, 'lesson-1-2', 'school')

      expect(verdict).toEqual({
        kind: 'correct',
        word: 'school',
        gloss: 'escuela',
        dueAt: '2026-11-20T09:10:00.000Z',
        stableWordCount: 1,
        retainedWordCount: 0,
        openedLevel: null,
        earnedSkill: null,
      })
    })

    it('refuses a hint on a recognition', async () => {
      const player = await studyLessonOne()
      world.clock.setTo(lessonFinishesAt)

      expect(await refusalOf(await hint(player, 'lesson-1-2'))).toEqual({
        status: 409,
        body: { kind: 'HintOnRecognition' },
      })
    })

    it('refuses a hint on a card not yet due', async () => {
      const player = await seedTheFirstRecall()
      world.clock.setTo('2026-11-12T09:09:59Z')

      expect(await refusalOf(await hint(player, 'lesson-1-2'))).toEqual({
        status: 409,
        body: { kind: 'ReviewNotDue' },
      })
    })
  })
})

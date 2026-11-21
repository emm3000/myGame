import { describe, expect, it } from 'vitest'
import {
  choiceIdOf,
  dueWordsOf,
  learningWorld,
  lessonFinishesAt,
  wordIds,
} from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { readTown, readReviews, answered, studyLessonOne, dueReviewOf } = world

  describe('the lesson finish', () => {
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

    it('enters the five cards due at the finish on the first reviews read after it', async () => {
      const player = await studyLessonOne()
      world.clock.setTo('2026-11-10T09:01:00Z')

      const { due } = await readReviews(player)

      expect(dueWordsOf(due)).toEqual(
        wordIds.map((wordId) => `${wordId} recognition ${lessonFinishesAt}`),
      )
    })

    it('enters no card before the finish', async () => {
      const player = await studyLessonOne()
      world.clock.setTo('2026-11-10T08:59:59Z')

      expect(await readReviews(player)).toMatchObject({ due: [], nextDueAt: null })
    })
  })
})

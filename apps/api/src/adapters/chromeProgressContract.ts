import { Instant, type LessonId, type PlayerId, type WordId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { ChromeProgressReader } from '../learning/ChromeProgressReader'

export type ChromeProgressFixture = {
  readonly progress: ChromeProgressReader
  readonly signUp: (playerId: PlayerId) => Promise<void>
  readonly holdCard: (playerId: PlayerId, wordId: WordId) => Promise<void>
  readonly earnSkill: (playerId: PlayerId, lessonId: LessonId) => Promise<void>
  readonly foundTown: (playerId: PlayerId) => Promise<void>
  readonly runLesson: (playerId: PlayerId, lessonId: LessonId, finishesAt: Instant) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const finishesAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

export const chromeProgressContract = (
  adapter: string,
  arrange: () => Promise<ChromeProgressFixture>,
): void => {
  describe(`${adapter} as the chrome progress`, () => {
    it('answers the cards the player holds, in word id order', async () => {
      const { progress, signUp, holdCard } = await arrange()
      await signUp(ana)
      await holdCard(ana, 'lesson-2-1')
      await holdCard(ana, 'lesson-1-1')

      expect((await progress.chromeProgressOf(ana))?.cards).toEqual([
        { wordId: 'lesson-1-1' },
        { wordId: 'lesson-2-1' },
      ])
    })

    it('answers the skills the player has earned, in lesson id order', async () => {
      const { progress, signUp, earnSkill } = await arrange()
      await signUp(ana)
      await earnSkill(ana, 'lesson-2')
      await earnSkill(ana, 'lesson-1')

      expect((await progress.chromeProgressOf(ana))?.skills).toEqual([
        { lessonId: 'lesson-1' },
        { lessonId: 'lesson-2' },
      ])
    })

    it("answers the lesson running in the player's town with its finish", async () => {
      const { progress, signUp, foundTown, runLesson } = await arrange()
      await signUp(ana)
      await foundTown(ana)
      await runLesson(ana, 'lesson-3', finishesAt)

      expect((await progress.chromeProgressOf(ana))?.lessonSlot).toEqual({
        lessonId: 'lesson-3',
        finishesAt,
      })
    })

    it('answers an empty progress for a player who holds nothing and runs no lesson', async () => {
      const { progress, signUp, foundTown } = await arrange()
      await signUp(ana)
      await foundTown(ana)

      expect(await progress.chromeProgressOf(ana)).toEqual({
        cards: [],
        skills: [],
        lessonSlot: null,
      })
    })

    it('answers no lesson slot for a player with no town', async () => {
      const { progress, signUp } = await arrange()
      await signUp(ana)

      expect((await progress.chromeProgressOf(ana))?.lessonSlot).toBeNull()
    })

    it("leaves out another player's cards, skills and lesson", async () => {
      const { progress, signUp, holdCard, earnSkill, foundTown, runLesson } = await arrange()
      await signUp(ana)
      await signUp(bruno)
      await holdCard(bruno, 'lesson-1-1')
      await earnSkill(bruno, 'lesson-1')
      await foundTown(bruno)
      await runLesson(bruno, 'lesson-2', finishesAt)

      expect(await progress.chromeProgressOf(ana)).toEqual({
        cards: [],
        skills: [],
        lessonSlot: null,
      })
    })

    it('answers no progress for a player with no account', async () => {
      const { progress } = await arrange()

      expect(await progress.chromeProgressOf(ana)).toBeUndefined()
    })
  })
}

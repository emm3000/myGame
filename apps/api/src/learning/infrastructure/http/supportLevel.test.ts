import { describe, expect, it } from 'vitest'
import { shippedCurriculum } from '#content/infrastructure/json/shippedCurriculum.testSupport'
import { learningWorld, lessonStartsAt, runSql } from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { signUpWithATown, readTown, seedTheFirstRecall } = world

  describe('the support level of a lesson word', () => {
    const { chromeLessonCount } = shippedCurriculum

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
  })
})

import { describe, expect, it } from 'vitest'
import { learningWorld, runSql } from './learningRoutes.testSupport'

describe('the learning routes', () => {
  const world = learningWorld()
  const { readTown, seedTheFirstRecall } = world

  describe('the support level of a lesson word', () => {
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
  })
})

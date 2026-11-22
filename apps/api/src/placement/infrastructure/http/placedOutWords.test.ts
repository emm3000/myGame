import { describe, expect, it } from 'vitest'
import { shippedCurriculum } from '#content/infrastructure/json/shippedCurriculum.testSupport'
import { runSql } from '#town/infrastructure/http/townRoutes.testSupport'
import {
  lessonStartsAt,
  schoolWorld,
} from '#town/school/infrastructure/http/schoolRoutes.testSupport'

describe('the placement on the town', () => {
  const { signUpWithATown, readTown } = schoolWorld()

  describe('the support level of a placed-out word', () => {
    const { chromeLessonCount } = shippedCurriculum

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

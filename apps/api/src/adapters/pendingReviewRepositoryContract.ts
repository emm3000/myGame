import type { PendingReviewRepository, PlayerId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type PendingReviewRepositoryFixture = {
  readonly pendingReviews: PendingReviewRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const hintShown = { hintShown: true, nearMissAnswer: null }
const nearMissAfterHint = { hintShown: true, nearMissAnswer: 'scool' }

export const pendingReviewRepositoryContract = (
  adapter: string,
  arrange: () => Promise<PendingReviewRepositoryFixture>,
): void => {
  describe(`${adapter} as a PendingReviewRepository`, () => {
    it('answers no pending review for a word without a hint or a near-miss', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toBeUndefined()
    })

    it('restores the pending review a save stored', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await pendingReviews.save(ana, 'school', hintShown)

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(hintShown)
    })

    it('replaces the pending review of a word on its next save', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await pendingReviews.save(ana, 'school', hintShown)
      await pendingReviews.save(ana, 'school', nearMissAfterHint)

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(nearMissAfterHint)
    })

    it('forgets a deleted pending review', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await pendingReviews.save(ana, 'school', hintShown)

      await pendingReviews.delete(ana, 'school')

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toBeUndefined()
    })

    it('keeps the pending review of one word from another', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await pendingReviews.save(ana, 'school', hintShown)

      expect(await pendingReviews.pendingReviewOf(ana, 'food')).toBeUndefined()
    })

    it('keeps the pending reviews of one player from another', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await pendingReviews.save(ana, 'school', hintShown)

      expect(await pendingReviews.pendingReviewOf(bruno, 'school')).toBeUndefined()
    })
  })
}

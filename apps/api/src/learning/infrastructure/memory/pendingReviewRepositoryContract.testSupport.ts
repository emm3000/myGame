import type { PendingReview, PendingReviewRepository, PlayerId, WordId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type PendingReviewRepositoryFixture = {
  readonly pendingReviews: PendingReviewRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
  readonly registerCards: (playerId: PlayerId, wordIds: ReadonlyArray<WordId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const hintShown: PendingReview = { hintShown: true, nearMissAnswer: null, shownFrame: null }
const nearMissAfterHint: PendingReview = {
  hintShown: true,
  nearMissAnswer: 'scool',
  shownFrame: 'I walk to ____ every day.',
}
const shownSchool: PendingReview = {
  hintShown: false,
  nearMissAnswer: null,
  shownFrame: 'I walk to ____ every day.',
}
const shownFood: PendingReview = {
  hintShown: false,
  nearMissAnswer: null,
  shownFrame: 'We buy ____ for the week.',
}

export const pendingReviewRepositoryContract = (
  adapter: string,
  arrange: () => Promise<PendingReviewRepositoryFixture>,
): void => {
  describe(`${adapter} as a PendingReviewRepository`, () => {
    it('answers no pending review for a word without a hint or a near-miss', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toBeUndefined()
    })

    it('restores the pending review a save stored', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])

      await pendingReviews.save(ana, 'school', hintShown)

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(hintShown)
    })

    it('replaces the pending review of a word on its next save', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])

      await pendingReviews.save(ana, 'school', hintShown)
      await pendingReviews.save(ana, 'school', nearMissAfterHint)

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(nearMissAfterHint)
    })

    it('forgets a deleted pending review', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])
      await pendingReviews.save(ana, 'school', hintShown)

      await pendingReviews.delete(ana, 'school')

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toBeUndefined()
    })

    it('keeps the pending review of one word from another', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])

      await pendingReviews.save(ana, 'school', hintShown)

      expect(await pendingReviews.pendingReviewOf(ana, 'food')).toBeUndefined()
    })

    it('keeps the pending reviews of one player from another', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana, bruno])
      await registerCards(ana, ['school'])

      await pendingReviews.save(ana, 'school', hintShown)

      expect(await pendingReviews.pendingReviewOf(bruno, 'school')).toBeUndefined()
    })

    it('answers no pending review to a player who waits on none', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await pendingReviews.pendingReviewsOf(ana)).toEqual(new Map())
    })

    it('answers every pending review of a player by its word', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school', 'food'])
      await pendingReviews.save(ana, 'school', hintShown)
      await pendingReviews.save(ana, 'food', shownFood)

      expect(await pendingReviews.pendingReviewsOf(ana)).toEqual(
        new Map([
          ['school', hintShown],
          ['food', shownFood],
        ]),
      )
    })

    it('stores several pending reviews in one save', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school', 'food'])

      await pendingReviews.saveAll(
        ana,
        new Map([
          ['school', shownSchool],
          ['food', shownFood],
        ]),
      )

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(shownSchool)
      expect(await pendingReviews.pendingReviewOf(ana, 'food')).toEqual(shownFood)
    })

    it('replaces the pending review a word already has when it saves several', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])
      await pendingReviews.save(ana, 'school', hintShown)

      await pendingReviews.saveAll(ana, new Map([['school', nearMissAfterHint]]))

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(nearMissAfterHint)
    })

    it('keeps the frame first stored when a later save names another', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])
      await pendingReviews.save(ana, 'school', shownSchool)

      await pendingReviews.save(ana, 'school', { ...shownSchool, shownFrame: 'My ____ is new.' })

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(shownSchool)
    })

    it('keeps the frame first stored when a later save names none', async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana])
      await registerCards(ana, ['school'])
      await pendingReviews.save(ana, 'school', shownSchool)

      await pendingReviews.saveAll(ana, new Map([['school', { ...shownSchool, shownFrame: null }]]))

      expect(await pendingReviews.pendingReviewOf(ana, 'school')).toEqual(shownSchool)
    })

    it('stores nothing when it saves none', async () => {
      const { pendingReviews, registerPlayers } = await arrange()
      await registerPlayers([ana])

      const saved = await pendingReviews.saveAll(ana, new Map())

      expect(saved).toEqual({ ok: true, value: undefined })
      expect(await pendingReviews.pendingReviewsOf(ana)).toEqual(new Map())
    })

    it("leaves another player's pending reviews out of a player's", async () => {
      const { pendingReviews, registerPlayers, registerCards } = await arrange()
      await registerPlayers([ana, bruno])
      await registerCards(ana, ['school'])
      await pendingReviews.save(ana, 'school', shownSchool)

      expect(await pendingReviews.pendingReviewsOf(bruno)).toEqual(new Map())
    })
  })
}

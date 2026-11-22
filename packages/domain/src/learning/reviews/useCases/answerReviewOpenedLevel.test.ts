import { assert, describe, expect, it } from 'vitest'
import type { Town } from '#town/domain/Town'
import {
  arrange,
  dueAtOf,
  farmingTownStoredAt,
  firstRecallDoneCard,
  lastRecallAt,
  learner,
  ownedBy,
  recallCard,
  retainedCardsOf,
  stableCardsOf,
} from '../testing/answerReviewFixtures'
import { answerReview } from './answerReview'

describe('answerReview', () => {
  it('opens level 3 at the recall that makes the 10th word stable', async () => {
    const { dependencies } = arrange(
      [...stableCardsOf(9), ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', stableWordCount: 10, retainedWordCount: 0, openedLevel: 3 },
    })
  })

  it('opens level 3 at a Hard recall after a hint that makes the 10th word stable', async () => {
    const { pendingReviews, dependencies } = arrange(
      [...stableCardsOf(9), ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )
    await pendingReviews.save(learner, 'school', {
      hintShown: true,
      nearMissAnswer: null,
      shownFrame: null,
    })

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', rating: 'hard', stableWordCount: 10, openedLevel: 3 },
    })
  })

  it('opens no level when the count already met it', async () => {
    const { dependencies } = arrange(
      [...stableCardsOf(10), ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', stableWordCount: 11, openedLevel: null },
    })
  })

  it('opens level 7 at the proof of the 50th retained word', async () => {
    const { dependencies } = arrange(
      [...retainedCardsOf(49), ownedBy('school', firstRecallDoneCard)],
      lastRecallAt,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', stableWordCount: 50, retainedWordCount: 50, openedLevel: 7 },
    })
  })

  it('opens no level past the top level a building has', async () => {
    const { dependencies } = arrange(
      [...retainedCardsOf(89), ownedBy('school', firstRecallDoneCard)],
      lastRecallAt,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', retainedWordCount: 90, openedLevel: null },
    })
  })

  it('a wrong answer opens no level', async () => {
    const { dependencies } = arrange(
      [...stableCardsOf(9), ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'house' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', rating: 'again', stableWordCount: 9, openedLevel: null },
    })
  })

  it('opens no level when the 10th stable word lapses', async () => {
    const { dependencies } = arrange(
      [...stableCardsOf(9), ownedBy('school', firstRecallDoneCard)],
      lastRecallAt,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'house' },
      dependencies,
    )

    expect(answered).toMatchObject({
      ok: true,
      value: { kind: 'rated', rating: 'again', stableWordCount: 9, openedLevel: null },
    })
  })

  it('opens a level with or without a town', async () => {
    const owned = [...stableCardsOf(9), ownedBy('school', recallCard)]
    const openedIn = async (heldTowns: ReadonlyArray<Town>) => {
      const { dependencies } = arrange(owned, dueAtOf(recallCard), heldTowns)
      const answered = await answerReview(
        { playerId: learner, wordId: 'school', answer: 'school' },
        dependencies,
      )
      assert(answered.ok && answered.value.kind === 'rated')
      return answered.value.openedLevel
    }

    expect([
      await openedIn([farmingTownStoredAt(dueAtOf(recallCard))]),
      await openedIn([]),
    ]).toEqual([3, 3])
  })
})

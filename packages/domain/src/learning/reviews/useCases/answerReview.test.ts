import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '#memory/MemoryCard'
import { defaultMemoryTerms } from '#memory/MemoryTerms'
import { Instant } from '#time/Instant'
import { inMemoryLessons } from '../../curriculum/testing/inMemoryLessons'
import {
  arrange,
  choiceIdOf,
  dueAtOf,
  headwords,
  heldCardOf,
  learner,
  lessonFinish,
  lessonWithALaterFrame,
  minutesAfterFinish,
  ownedBy,
  recallCard,
  shownAs,
} from '../testing/answerReviewFixtures'
import { answerReview } from './answerReview'
import { showDueReviews } from './showDueReviews'

describe('answerReview', () => {
  it('refuses a word no lesson holds', async () => {
    const { dependencies } = arrange([], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'castle', answer: 'castle' },
      dependencies,
    )

    expect(answered).toEqual({ ok: false, error: { kind: 'UnknownWord', wordId: 'castle' } })
  })

  it('refuses a word the player holds no card of', async () => {
    const { dependencies } = arrange([], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toEqual({ ok: false, error: { kind: 'WordNotHeld', wordId: 'school' } })
  })

  it('refuses a review that is not due and writes nothing', async () => {
    const dueAt = dueAtOf(recallCard)
    const oneMillisecondEarly = Instant.fromEpochMilliseconds(dueAt.epochMilliseconds - 1)
    const { cards, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      oneMillisecondEarly,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toEqual({
      ok: false,
      error: { kind: 'ReviewNotDue', wordId: 'school', dueAt },
    })
    expect(heldCardOf(cards, 'school').card).toBe(recallCard)
    expect(reviewLog.entries()).toEqual([])
  })

  it('rates the right recognition Good and steps the card through FSRS', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, dependencies } = arrange([ownedBy('school', entered)], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: choiceIdOf('school', 'school', entered) },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'good' })
    expect(heldCardOf(cards, 'school').card.stored).toMatchObject({
      state: 'learning',
      step: 1,
      lastReviewAt: lessonFinish,
    })
    expect(dueAtOf(heldCardOf(cards, 'school').card)).toEqual(minutesAfterFinish(10))
  })

  it('rates the wrong recognition Again', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { dependencies } = arrange(
      [ownedBy('school', entered), ownedBy('home', entered)],
      lessonFinish,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: choiceIdOf('school', 'home', entered) },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })

  it('refuses a recognition answer that is none of its choice ids, writing nothing', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, reviewLog, dependencies } = arrange([ownedBy('school', entered)], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toEqual({ ok: false, error: { kind: 'UnknownChoice', wordId: 'school' } })
    expect([heldCardOf(cards, 'school').card, reviewLog.entries()]).toEqual([entered, []])
  })

  it('appends one log entry holding the card before and after', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, reviewLog, dependencies } = arrange(
      [ownedBy('school', entered), ownedBy('home', entered)],
      lessonFinish,
    )
    const homeChoiceId = choiceIdOf('school', 'home', entered)

    await answerReview({ playerId: learner, wordId: 'school', answer: homeChoiceId }, dependencies)

    expect(reviewLog.entries()).toEqual([
      {
        playerId: learner,
        wordId: 'school',
        reviewedAt: lessonFinish,
        format: 'recognition',
        answer: homeChoiceId,
        nearMissAnswer: null,
        hintShown: false,
        rating: 'again',
        elapsedDays: null,
        shownFrame: null,
        before: entered.stored,
        after: heldCardOf(cards, 'school').card.stored,
      },
    ])
  })

  it('logs the frame the recall showed', async () => {
    const { pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )
    const lessons = inMemoryLessons([lessonWithALaterFrame], headwords)
    await showDueReviews(
      {
        playerId: learner,
        cards: [{ wordId: 'school', card: recallCard }],
        stage: ['lesson-1', 'lesson-2'],
      },
      { pendingReviews, lessons, clock: dependencies.clock, terms: defaultMemoryTerms },
    )

    await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      { ...dependencies, lessons },
    )

    expect(reviewLog.entries()).toMatchObject([{ shownFrame: 'My ____ is new.' }])
  })

  it('logs the frame the recognition showed', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', entered), ownedBy('home', entered)],
      lessonFinish,
    )
    await pendingReviews.save(learner, 'school', shownAs('I walk to school every day.'))

    await answerReview(
      { playerId: learner, wordId: 'school', answer: choiceIdOf('school', 'school', entered) },
      dependencies,
    )

    expect(reviewLog.entries()).toMatchObject([{ shownFrame: 'I walk to school every day.' }])
  })

  it('logs the frame shown before a near-miss', async () => {
    const { pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )
    await pendingReviews.save(learner, 'school', shownAs('My ____ is new.'))
    await answerReview({ playerId: learner, wordId: 'school', answer: 'scool' }, dependencies)

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(reviewLog.entries()).toMatchObject([
      { nearMissAnswer: 'scool', shownFrame: 'My ____ is new.' },
    ])
  })

  it('rates a correct typed recall Good and logs its elapsed whole days', async () => {
    const { reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: '  School ' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'good' })
    expect(reviewLog.entries()).toMatchObject([{ format: 'recall', elapsedDays: 2 }])
  })

  it('rates a wrong typed recall Again', async () => {
    const { dependencies } = arrange([ownedBy('school', recallCard)], dueAtOf(recallCard))

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'house' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })

  it('rates a correct typed answer after a hint as Hard and clears the pending review', async () => {
    const { pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
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

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'hard' })
    expect(reviewLog.entries()).toMatchObject([{ hintShown: true }])
    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toBeUndefined()
  })

  it('answers a near-miss with no rating, leaving the card and the log untouched', async () => {
    const { cards, pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'scool' },
      dependencies,
    )

    expect(answered).toEqual({ ok: true, value: { kind: 'nearMiss' } })
    expect(heldCardOf(cards, 'school').card).toBe(recallCard)
    expect(reviewLog.entries()).toEqual([])
    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: false,
      nearMissAnswer: 'scool',
      shownFrame: null,
    })
  })

  it('rates a correct answer after a near-miss as Hard and logs the near-miss', async () => {
    const { reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )
    await answerReview({ playerId: learner, wordId: 'school', answer: 'scool' }, dependencies)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'hard' })
    expect(reviewLog.entries()).toMatchObject([{ answer: 'school', nearMissAnswer: 'scool' }])
  })

  it('rates a second near-miss in a row Again', async () => {
    const { dependencies } = arrange([ownedBy('school', recallCard)], dueAtOf(recallCard))
    await answerReview({ playerId: learner, wordId: 'school', answer: 'scool' }, dependencies)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'shcool' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })
})

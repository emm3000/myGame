import { assert, describe, expect, it } from 'vitest'
import type { Lesson } from '../learning/Lesson'
import { dueInstantOf } from '../memory/dueInstantOf'
import { MemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import type { Clock } from '../ports/Clock'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryPendingReviews } from '../testing/inMemoryPendingReviews'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import { requestHint } from './requestHint'

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const learner = 'player-learner'

const reviewedAtEachDue = (ratings: ReadonlyArray<MemoryRating>): MemoryCard =>
  ratings.reduce((card, rating) => {
    const dueAt = dueInstantOf(card, defaultMemoryTerms)
    assert(dueAt.ok)
    const next = reviewMemoryCard(card, rating, dueAt.value, defaultMemoryTerms)
    assert(next.ok)
    return next.value
  }, MemoryCard.entered(lessonFinish))

const dueAtOf = (card: MemoryCard): Instant => {
  const dueAt = dueInstantOf(card, defaultMemoryTerms)
  assert(dueAt.ok)
  return dueAt.value
}

const recallCard = reviewedAtEachDue(['good', 'good'])

const unitLesson: Lesson = {
  ...lessonOne,
  id: 'lesson-units',
  words: [
    {
      id: 'give-up',
      acceptedForms: ['give up'],
      gloss: 'rendirse',
      definition: 'definition of rendirse',
      frames: [{ frame: 'She will not give up.', gappedFrame: 'She will not ____ ____.' }],
    },
  ],
}

const arrange = (card: MemoryCard, now: Instant) => {
  const owned: ReadonlyArray<OwnedCard> = [
    { playerId: learner, wordId: 'school', card },
    { playerId: learner, wordId: 'give-up', card },
  ]
  const pendingReviews = inMemoryPendingReviews()
  const dependencies = {
    cards: inMemoryCards(owned),
    pendingReviews,
    lessons: inMemoryLessons([lessonOne, unitLesson], []),
    clock: frozenClock(now),
    terms: defaultMemoryTerms,
  }
  return { pendingReviews, dependencies }
}

describe('requestHint', () => {
  it('hints a single word with one element', async () => {
    const { dependencies } = arrange(recallCard, dueAtOf(recallCard))

    const hint = await requestHint({ playerId: learner, wordId: 'school' }, dependencies)

    expect(hint).toEqual({ ok: true, value: { words: [{ firstLetter: 's', letterCount: 6 }] } })
  })

  it('hints give up as g of 4 then u of 2', async () => {
    const { dependencies } = arrange(recallCard, dueAtOf(recallCard))

    const hint = await requestHint({ playerId: learner, wordId: 'give-up' }, dependencies)

    expect(hint).toEqual({
      ok: true,
      value: {
        words: [
          { firstLetter: 'g', letterCount: 4 },
          { firstLetter: 'u', letterCount: 2 },
        ],
      },
    })
  })

  it('marks the pending review as hinted', async () => {
    const { pendingReviews, dependencies } = arrange(recallCard, dueAtOf(recallCard))

    await requestHint({ playerId: learner, wordId: 'school' }, dependencies)

    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: true,
      nearMissAnswer: null,
      shownFrame: null,
    })
  })

  it('keeps the near-miss already pending', async () => {
    const { pendingReviews, dependencies } = arrange(recallCard, dueAtOf(recallCard))
    await pendingReviews.save(learner, 'school', {
      hintShown: false,
      nearMissAnswer: 'scool',
      shownFrame: null,
    })

    await requestHint({ playerId: learner, wordId: 'school' }, dependencies)

    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: true,
      nearMissAnswer: 'scool',
      shownFrame: null,
    })
  })

  it('keeps the frame the review showed', async () => {
    const { pendingReviews, dependencies } = arrange(recallCard, dueAtOf(recallCard))
    await pendingReviews.save(learner, 'school', {
      hintShown: false,
      nearMissAnswer: null,
      shownFrame: 'My ____ is new.',
    })

    await requestHint({ playerId: learner, wordId: 'school' }, dependencies)

    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: true,
      nearMissAnswer: null,
      shownFrame: 'My ____ is new.',
    })
  })

  it('refuses a hint on a card reviewed by recognition and writes nothing', async () => {
    const { pendingReviews, dependencies } = arrange(MemoryCard.entered(lessonFinish), lessonFinish)

    const hint = await requestHint({ playerId: learner, wordId: 'school' }, dependencies)

    expect(hint).toEqual({ ok: false, error: { kind: 'HintOnRecognition', wordId: 'school' } })
    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toBeUndefined()
  })

  it('refuses a hint on a card not yet due and writes nothing', async () => {
    const dueAt = dueAtOf(recallCard)
    const { pendingReviews, dependencies } = arrange(
      recallCard,
      Instant.fromEpochMilliseconds(dueAt.epochMilliseconds - 1),
    )

    const hint = await requestHint({ playerId: learner, wordId: 'school' }, dependencies)

    expect(hint).toEqual({ ok: false, error: { kind: 'ReviewNotDue', wordId: 'school', dueAt } })
    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toBeUndefined()
  })
})

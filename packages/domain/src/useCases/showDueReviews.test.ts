import { assert, describe, expect, it } from 'vitest'
import type { DomainError } from '../DomainError'
import type { HeldCard } from '../learning/HeldCard'
import type { Lesson } from '../learning/Lesson'
import type { Stage } from '../learning/stageOf'
import { dueInstantOf } from '../memory/dueInstantOf'
import { MemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryPendingReviews } from '../testing/inMemoryPendingReviews'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import { showDueReviews } from './showDueReviews'

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

const enteredCard = MemoryCard.entered(lessonFinish)

const recallCard = reviewedAtEachDue(['good', 'good'])

const lessonWithALaterFrame: Lesson = {
  ...lessonOne,
  words: lessonOne.words.map((word) =>
    word.id === 'school'
      ? {
          ...word,
          frames: [
            word.frames[0],
            {
              frame: 'My school is new.',
              gappedFrame: 'My ____ is new.',
              fromLessonId: 'lesson-2',
            },
          ],
        }
      : word,
  ),
}

const stageAtLessonOne: Stage = ['lesson-1']

const stageAtLessonTwo: Stage = ['lesson-1', 'lesson-2']

const arrange = (now: Instant) => {
  const pendingReviews = inMemoryPendingReviews()
  const dependencies = {
    pendingReviews,
    lessons: inMemoryLessons([lessonWithALaterFrame], []),
    clock: frozenClock(now),
    terms: defaultMemoryTerms,
  }
  return { pendingReviews, dependencies }
}

const schoolHeldAs = (card: MemoryCard): ReadonlyArray<HeldCard> => [{ wordId: 'school', card }]

describe('showDueReviews', () => {
  it('shows a recognition its anchor frame in full', async () => {
    const { dependencies } = arrange(lessonFinish)

    const shown = await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(enteredCard), stage: stageAtLessonTwo },
      dependencies,
    )

    assert(shown.ok)
    expect(shown.value).toMatchObject([
      {
        word: { id: 'school' },
        due: { dueAt: lessonFinish },
        shownFrame: 'I walk to school every day.',
      },
    ])
  })

  it('shows a recall the gapped anchor while the stage reaches no later frame', async () => {
    const { dependencies } = arrange(dueAtOf(recallCard))

    const shown = await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonOne },
      dependencies,
    )

    assert(shown.ok)
    expect(shown.value).toMatchObject([{ shownFrame: 'I walk to ____ every day.' }])
  })

  it('shows a recall the gapped later frame once the stage reaches its lesson', async () => {
    const { dependencies } = arrange(dueAtOf(recallCard))

    const shown = await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonTwo },
      dependencies,
    )

    assert(shown.ok)
    expect(shown.value).toMatchObject([{ shownFrame: 'My ____ is new.' }])
  })

  it('keeps the frame first shown on the pending review', async () => {
    const { pendingReviews, dependencies } = arrange(dueAtOf(recallCard))

    await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonOne },
      dependencies,
    )

    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: false,
      nearMissAnswer: null,
      shownFrame: 'I walk to ____ every day.',
    })
  })

  it('shows the frame first shown again though the stage has grown since', async () => {
    const { dependencies } = arrange(dueAtOf(recallCard))
    await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonOne },
      dependencies,
    )

    const shownAgain = await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonTwo },
      dependencies,
    )

    assert(shownAgain.ok)
    expect(shownAgain.value).toMatchObject([{ shownFrame: 'I walk to ____ every day.' }])
  })

  it('keeps the hint and the near-miss of a pending review that held no frame', async () => {
    const { pendingReviews, dependencies } = arrange(dueAtOf(recallCard))
    await pendingReviews.save(learner, 'school', {
      hintShown: true,
      nearMissAnswer: 'scool',
      shownFrame: null,
    })

    await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonOne },
      dependencies,
    )

    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: true,
      nearMissAnswer: 'scool',
      shownFrame: 'I walk to ____ every day.',
    })
  })

  it('shows no card before it is due', async () => {
    const { dependencies } = arrange(lessonFinish)

    const shown = await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonOne },
      dependencies,
    )

    expect(shown).toEqual({ ok: true, value: [] })
  })

  it('keeps no frame for a card not yet due', async () => {
    const { pendingReviews, dependencies } = arrange(lessonFinish)

    await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(recallCard), stage: stageAtLessonOne },
      dependencies,
    )

    expect(await pendingReviews.pendingReviewsOf(learner)).toEqual(new Map())
  })

  it('refuses a card at a learning step the terms lack', async () => {
    const { dependencies } = arrange(lessonFinish)

    const shown = await showDueReviews(
      {
        playerId: learner,
        cards: schoolHeldAs(reviewedAtEachDue(['good'])),
        stage: stageAtLessonOne,
      },
      { ...dependencies, terms: { ...defaultMemoryTerms, learningStepsSeconds: [60] } },
    )

    expect(shown).toMatchObject({ ok: false, error: { kind: 'UnknownMemoryStep' } })
  })

  it('answers the refusal of the store that keeps the frames', async () => {
    const { pendingReviews, dependencies } = arrange(lessonFinish)
    const refusal: DomainError = { kind: 'UnknownWord', wordId: 'school' }

    const shown = await showDueReviews(
      { playerId: learner, cards: schoolHeldAs(enteredCard), stage: stageAtLessonOne },
      {
        ...dependencies,
        pendingReviews: { ...pendingReviews, saveAll: async () => err(refusal) },
      },
    )

    expect(shown).toEqual({ ok: false, error: refusal })
  })

  it('shows the due cards in due order', async () => {
    const { dependencies } = arrange(dueAtOf(recallCard))

    const shown = await showDueReviews(
      {
        playerId: learner,
        cards: [
          { wordId: 'school', card: recallCard },
          { wordId: 'home', card: enteredCard },
        ],
        stage: stageAtLessonOne,
      },
      dependencies,
    )

    assert(shown.ok)
    expect(shown.value.map(({ word }) => word.id)).toEqual(['home', 'school'])
  })

  it('keeps no frame when a due card names a word no lesson holds', async () => {
    const { pendingReviews, dependencies } = arrange(lessonFinish)

    await showDueReviews(
      {
        playerId: learner,
        cards: [
          { wordId: 'home', card: enteredCard },
          { wordId: 'gone', card: enteredCard },
        ],
        stage: stageAtLessonOne,
      },
      dependencies,
    )

    expect(await pendingReviews.pendingReviewsOf(learner)).toEqual(new Map())
  })

  it('refuses a due card whose word no lesson holds', async () => {
    const { dependencies } = arrange(lessonFinish)

    const shown = await showDueReviews(
      {
        playerId: learner,
        cards: [
          { wordId: 'home', card: enteredCard },
          { wordId: 'gone', card: enteredCard },
        ],
        stage: stageAtLessonOne,
      },
      dependencies,
    )

    expect(shown).toEqual({ ok: false, error: { kind: 'UnknownWord', wordId: 'gone' } })
  })
})

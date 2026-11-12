import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { Instant } from '../time/Instant'
import type { LaterFrame, LessonWord, WordFrame } from './Lesson'
import { recallFrameOf } from './recallFrameOf'

const enteredAt = Instant.fromEpochMilliseconds(1_794_301_200_000)

const MINUTE_MILLISECONDS = 60_000

const anchor: WordFrame = {
  frame: 'We have a new home in this town.',
  gappedFrame: 'We have a new ____ in this town.',
}

const frameForLessonTwo: LaterFrame = {
  frame: 'My home is near the school.',
  gappedFrame: 'My ____ is near the school.',
  fromLessonId: 'lesson-2',
}

const frameForLessonThree: LaterFrame = {
  frame: 'They work at home every week.',
  gappedFrame: 'They work at ____ every week.',
  fromLessonId: 'lesson-3',
}

const wordOf = (id: string): LessonWord => ({
  id,
  acceptedForms: ['home'],
  gloss: 'hogar',
  frames: [anchor, frameForLessonTwo, frameForLessonThree],
})

const home = wordOf('home')

const cardReviewedAfter = (minutes: number): MemoryCard => {
  const reviewedAt = Instant.fromEpochMilliseconds(
    enteredAt.epochMilliseconds + minutes * MINUTE_MILLISECONDS,
  )
  const reviewed = reviewMemoryCard(
    MemoryCard.entered(enteredAt),
    'good',
    reviewedAt,
    defaultMemoryTerms,
  )
  assert(reviewed.ok)
  return reviewed.value
}

const twentyReviews = Array.from({ length: 20 }, (_, index) => cardReviewedAfter(index + 1))

const twentyWords = Array.from({ length: 20 }, (_, index) => wordOf(`word-${index + 1}`))

describe('recallFrameOf', () => {
  it('shows the anchor in recall while the stage reaches no later frame', () => {
    expect(recallFrameOf(home, cardReviewedAfter(1), ['lesson-1'])).toBe(anchor)
  })

  it('shows a later frame once the stage reaches its lesson', () => {
    expect(recallFrameOf(home, cardReviewedAfter(1), ['lesson-1', 'lesson-2'])).toBe(
      frameForLessonTwo,
    )
  })

  it('never shows a later frame past the stage', () => {
    const shown = twentyReviews.map((card) => recallFrameOf(home, card, ['lesson-1', 'lesson-2']))

    expect(new Set(shown)).toEqual(new Set([frameForLessonTwo]))
  })

  it('never shows the anchor once the stage reaches a later frame', () => {
    const stage = ['lesson-1', 'lesson-2', 'lesson-3']

    const shown = twentyReviews.map((card) => recallFrameOf(home, card, stage))

    expect(shown).not.toContain(anchor)
  })

  it('keeps the same frame across re-reads', () => {
    const stage = ['lesson-1', 'lesson-2', 'lesson-3']
    const card = cardReviewedAfter(1)

    expect(recallFrameOf(home, card, stage)).toBe(recallFrameOf(home, card, stage))
  })

  it('shows each later frame the stage reaches after some review', () => {
    const stage = ['lesson-1', 'lesson-2', 'lesson-3']

    const shown = twentyReviews.map((card) => recallFrameOf(home, card, stage))

    expect(new Set(shown)).toEqual(new Set([frameForLessonTwo, frameForLessonThree]))
  })

  it('shows two words reviewed at one instant frames of their own', () => {
    const stage = ['lesson-1', 'lesson-2', 'lesson-3']
    const card = cardReviewedAfter(1)

    const shown = twentyWords.map((word) => recallFrameOf(word, card, stage))

    expect(new Set(shown)).toEqual(new Set([frameForLessonTwo, frameForLessonThree]))
  })

  it('takes the later frame with the lowest hash of the word, its position and the last review', () => {
    const stage = ['lesson-1', 'lesson-2', 'lesson-3']

    const shown = twentyReviews.slice(0, 6).map((card) => recallFrameOf(home, card, stage))

    expect(shown).toEqual([
      frameForLessonTwo,
      frameForLessonTwo,
      frameForLessonTwo,
      frameForLessonThree,
      frameForLessonTwo,
      frameForLessonThree,
    ])
  })

  it('shows a later frame the stage reaches when an earlier one of the word is past it', () => {
    const lateFirst: LessonWord = {
      ...home,
      frames: [anchor, frameForLessonThree, frameForLessonTwo],
    }

    const shown = twentyReviews.map((card) =>
      recallFrameOf(lateFirst, card, ['lesson-1', 'lesson-2']),
    )

    expect(new Set(shown)).toEqual(new Set([frameForLessonTwo]))
  })
})

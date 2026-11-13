import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { inMemoryBands } from '../testing/inMemoryBands'
import { inMemoryFrames } from '../testing/inMemoryFrames'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { lessonOne } from '../testing/lessonOne'
import { townLessonTwo } from '../testing/townLessonTwo'
import { Instant } from '../time/Instant'
import type { Band } from './BandStart'
import type { FrameReader } from './FrameReader'
import type { FrameToken } from './FrameToken'
import { frameSpansOf } from './frameSpansOf'
import type { HeldCard } from './HeldCard'
import type { Scaffold } from './Scaffold'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const townHeldAt = (stability: number): HeldCard => {
  const stored = {
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: instantAt('2026-11-12T09:10:00Z'),
    lastRating: 'good',
    enteredAt: instantAt('2026-11-10T09:00:00Z'),
    retainedAt: null,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return { wordId: 'town', card: card.value }
}

const homeFrame = 'We have a new home in this town.'

const homeTokens: ReadonlyArray<FrameToken> = [
  { text: 'We have a new ', wordId: null },
  { text: 'home', wordId: null },
  { text: ' in this ', wordId: null },
  { text: 'town', wordId: 'town' },
  { text: '.', wordId: null },
]

type Learner = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands?: ReadonlyArray<Band>
  readonly scaffold?: Scaffold
}

const readerOf = ({ cards, placedOutBands = [], scaffold = 'es' }: Learner): FrameReader => ({
  cards,
  placedOutBands,
  scaffold,
  lessons: {
    ...inMemoryLessons([lessonOne, townLessonTwo], []),
    ...inMemoryBands([{ band: 2, lessonIds: ['lesson-2'], words: [] }]),
    ...inMemoryFrames([], new Map()),
  },
})

const withholdingNothing = (): boolean => false

const townSupportOf = (learner: Learner): unknown =>
  frameSpansOf(homeFrame, homeTokens, readerOf(learner), withholdingNothing)[3]?.support

describe('frameSpansOf', () => {
  it('supports a word under 7 days beside it', () => {
    expect(townSupportOf({ cards: [townHeldAt(6.99)] })).toEqual({
      shown: 'beside',
      text: 'pueblo',
      language: 'es',
    })
  })

  it('supports a word from 7 days on tap', () => {
    expect(townSupportOf({ cards: [townHeldAt(7)] })).toEqual({
      shown: 'onTap',
      text: 'pueblo',
      language: 'es',
    })
  })

  it('supports a word from 30 days with its definition under es', () => {
    expect(townSupportOf({ cards: [townHeldAt(30)] })).toEqual({
      shown: 'onTap',
      text: 'a small city',
      language: 'en',
    })
  })

  it('supports a word with its definition under none', () => {
    expect(townSupportOf({ cards: [townHeldAt(3)], scaffold: 'none' })).toEqual({
      shown: 'beside',
      text: 'a small city',
      language: 'en',
    })
  })

  it('supports a word with no card beside it', () => {
    expect(townSupportOf({ cards: [] })).toEqual({
      shown: 'beside',
      text: 'pueblo',
      language: 'es',
    })
  })

  it('reads a placed-out word with no card as on tap', () => {
    expect(townSupportOf({ cards: [], placedOutBands: [2] })).toEqual({
      shown: 'onTap',
      text: 'pueblo',
      language: 'es',
    })
  })

  it('never supports a token that names no card word', () => {
    const spans = frameSpansOf(homeFrame, homeTokens, readerOf({ cards: [] }), withholdingNothing)

    expect(spans.filter(({ support }) => support !== null).map(({ text }) => text)).toEqual([
      'town',
    ])
  })

  it('never supports a token whose word no lesson teaches', () => {
    const tokens = [
      { text: 'Our ', wordId: null },
      { text: 'river', wordId: 'river' },
    ]

    expect(frameSpansOf('Our river', tokens, readerOf({ cards: [] }), withholdingNothing)).toEqual([
      { text: 'Our ', support: null },
      { text: 'river', support: null },
    ])
  })

  it("joins the spans' text into the frame shown", () => {
    const spans = frameSpansOf(homeFrame, homeTokens, readerOf({ cards: [] }), withholdingNothing)

    expect(spans.map(({ text }) => text).join('')).toBe('We have a new home in this town.')
  })

  it('drops the support a withholding rule names', () => {
    const spans = frameSpansOf(
      homeFrame,
      homeTokens,
      readerOf({ cards: [] }),
      ({ text }) => text === 'pueblo',
    )

    expect(spans.every(({ support }) => support === null)).toBe(true)
  })

  it('answers an unmatched stored frame as one span', () => {
    expect(
      frameSpansOf('We have a home here.', undefined, readerOf({ cards: [] }), withholdingNothing),
    ).toEqual([{ text: 'We have a home here.', support: null }])
  })
})

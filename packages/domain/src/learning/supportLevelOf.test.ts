import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import { supportLevelOf } from './supportLevelOf'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const enteredAt = instantAt('2026-11-10T09:00:00Z')

const heldAt = (stability: number): HeldCard => {
  const stored = {
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: instantAt('2026-11-12T09:10:00Z'),
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return { wordId: 'lesson-1-2', card: card.value }
}

const enteredWord: HeldCard = { wordId: 'lesson-1-2', card: MemoryCard.entered(enteredAt) }

const notPlacedOut = false

describe('supportLevelOf under es', () => {
  it('shows the gloss beside a word under 7 days', () => {
    expect([
      supportLevelOf(undefined, notPlacedOut, 'es'),
      supportLevelOf(enteredWord, notPlacedOut, 'es'),
      supportLevelOf(heldAt(6.99), notPlacedOut, 'es'),
    ]).toEqual([
      { shown: 'beside', help: 'gloss' },
      { shown: 'beside', help: 'gloss' },
      { shown: 'beside', help: 'gloss' },
    ])
  })

  it('shows it on tap from 7 days', () => {
    expect([
      supportLevelOf(heldAt(7), notPlacedOut, 'es'),
      supportLevelOf(heldAt(29.99), notPlacedOut, 'es'),
    ]).toEqual([
      { shown: 'onTap', help: 'gloss' },
      { shown: 'onTap', help: 'gloss' },
    ])
  })

  it('shows the definition on tap from 30 days', () => {
    expect(supportLevelOf(heldAt(30), notPlacedOut, 'es')).toEqual({
      shown: 'onTap',
      help: 'definition',
    })
  })

  it('reads a placed-out word with no card as at 7 days', () => {
    expect(supportLevelOf(undefined, true, 'es')).toEqual({ shown: 'onTap', help: 'gloss' })
  })

  it('reads a placed-out word with a card by its card', () => {
    expect([supportLevelOf(heldAt(3), true, 'es'), supportLevelOf(heldAt(30), true, 'es')]).toEqual(
      [
        { shown: 'beside', help: 'gloss' },
        { shown: 'onTap', help: 'definition' },
      ],
    )
  })
})

describe('supportLevelOf under none', () => {
  it('shows the definition beside a word under 7 days', () => {
    expect([
      supportLevelOf(undefined, notPlacedOut, 'none'),
      supportLevelOf(heldAt(6.99), notPlacedOut, 'none'),
    ]).toEqual([
      { shown: 'beside', help: 'definition' },
      { shown: 'beside', help: 'definition' },
    ])
  })

  it('shows the definition on tap from 7 days', () => {
    expect([
      supportLevelOf(heldAt(7), notPlacedOut, 'none'),
      supportLevelOf(heldAt(30), notPlacedOut, 'none'),
      supportLevelOf(undefined, true, 'none'),
    ]).toEqual([
      { shown: 'onTap', help: 'definition' },
      { shown: 'onTap', help: 'definition' },
      { shown: 'onTap', help: 'definition' },
    ])
  })
})

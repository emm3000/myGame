import { describe, expect, it } from 'vitest'
import { inMemoryPlacementWords, placementWordsOfBand } from '../testing/placementWords'
import type { PlacementSample } from './Placement'
import type { PlacementWord } from './PlacementWord'
import { placementItemsOf } from './placementItemsOf'

const wordOf = (name: string, gloss: string, definition: string): PlacementWord => ({
  id: `word-${name}`,
  headword: name,
  word: name,
  gloss,
  definition,
  isChrome: false,
})

const sampleOf = (words: ReadonlyArray<PlacementWord>): PlacementSample => ({
  band: 1,
  wordIds: words.map(({ id }) => id),
})

const shownMeaningsOf = (
  words: ReadonlyArray<PlacementWord>,
  scaffold: 'es' | 'none',
): ReadonlyArray<ReadonlyArray<string>> =>
  placementItemsOf(sampleOf(words), inMemoryPlacementWords([{ band: 1, words }]), scaffold).map(
    ({ choices }) => choices.map(({ gloss }) => gloss).sort(),
  )

describe('placementItemsOf', () => {
  it('offers the Spanish glosses as the choices under es', () => {
    const words = placementWordsOfBand(1, 4)

    expect(shownMeaningsOf(words, 'es')[0]).toEqual(words.map(({ gloss }) => gloss).sort())
  })

  it('offers the English definitions as the choices under none', () => {
    const words = placementWordsOfBand(1, 4)

    expect(shownMeaningsOf(words, 'none')[0]).toEqual(
      words.map(({ definition }) => definition).sort(),
    )
  })

  it('offers two words of one gloss apart under none when their definitions differ', () => {
    const words = [
      wordOf('home', 'casa', 'where you live'),
      wordOf('house', 'casa', 'a building people live in'),
      wordOf('food', 'comida', 'what you eat'),
    ]

    expect(shownMeaningsOf(words, 'none')[0]).toEqual([
      'a building people live in',
      'what you eat',
      'where you live',
    ])
  })

  it('offers no other word whose definition is the asked word’s under none', () => {
    const words = [
      wordOf('home', 'hogar', 'where you live'),
      wordOf('house', 'casa', 'where you live'),
      wordOf('food', 'comida', 'what you eat'),
    ]

    expect(shownMeaningsOf(words, 'none')[0]).toEqual(['what you eat', 'where you live'])
  })
})

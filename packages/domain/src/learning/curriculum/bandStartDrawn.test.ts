import { describe, expect, it } from 'vitest'
import { firstItemsRandom } from '#ports/testing/firstItemsRandom'
import { Instant } from '#time/Instant'
import type { BandWord, Headword } from './BandStart'
import { bandStartDrawn } from './bandStartDrawn'

const startedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-18T09:00:00Z'))

const headwordsOf = (count: number): ReadonlyArray<Headword> =>
  Array.from({ length: count }, (_, index) => `word${index + 1}`)

const bandWordsOf = (headwords: ReadonlyArray<Headword>): ReadonlyArray<BandWord> =>
  headwords.map((headword) => ({ headword, isChrome: false }))

describe('bandStartDrawn', () => {
  it('draws every unpractised word when fewer are left than the held-out count', () => {
    const twentyWords = headwordsOf(20)
    const practisedExceptLast = twentyWords.slice(0, 19)

    const drawn = bandStartDrawn(
      2,
      bandWordsOf(twentyWords),
      practisedExceptLast,
      startedAt,
      firstItemsRandom,
    )

    expect(drawn.heldOutWords).toEqual(['word20'])
  })
})

import { describe, expect, it } from 'vitest'
import { placeArtOf } from '../design-system/placeArtOf'
import { wordArtOf } from './wordArtOf'

describe('wordArtOf', () => {
  it.each([
    ['home', 'homes'],
    ['farm', 'farm'],
    ['factory', 'factory'],
    ['station', 'powerStation'],
    ['storage', 'storage'],
    ['school', 'school'],
    ['office', 'office'],
  ] as const)('draws %s with the silhouette of %s', (word, place) => {
    expect(wordArtOf(word)?.length).toBe(placeArtOf(place, 0).length)
  })

  it("draws a word's silhouette in on-block with no windows", () => {
    const fills = (wordArtOf('station') ?? []).map(({ attributes }) => attributes.fill)

    expect([...new Set(fills)]).toEqual(['var(--on-block)'])
  })

  it('leaves every other word without art', () => {
    expect(wordArtOf('money')).toBeUndefined()
  })
})

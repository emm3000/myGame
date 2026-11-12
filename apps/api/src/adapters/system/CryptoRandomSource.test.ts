import { describe, expect, it } from 'vitest'
import { CryptoRandomSource } from './CryptoRandomSource'

const headwords = ['say', 'make', 'know', 'time', 'year', 'think', 'see', 'come', 'want', 'look']

describe('CryptoRandomSource', () => {
  it('samples exactly the count asked', () => {
    expect(new CryptoRandomSource().sampleOf(headwords, 3)).toHaveLength(3)
  })

  it('never samples an item twice', () => {
    const sample = new CryptoRandomSource().sampleOf(headwords, headwords.length)

    expect([...sample].sort()).toEqual([...headwords].sort())
  })

  it('refuses to sample more items than the list holds', () => {
    expect(() => new CryptoRandomSource().sampleOf(headwords.slice(0, 2), 3)).toThrow(
      new RangeError('Cannot sample 3 of 2 items'),
    )
  })

  it('samples nothing for a count of 0', () => {
    expect(new CryptoRandomSource().sampleOf(headwords, 0)).toEqual([])
  })

  it('reaches every item of the list', () => {
    const random = new CryptoRandomSource()

    const sampled = new Set(Array.from({ length: 400 }, () => random.sampleOf(headwords, 1)).flat())

    expect([...sampled].sort()).toEqual([...headwords].sort())
  })

  it('leaves the list it samples from untouched', () => {
    const items = [...headwords]

    new CryptoRandomSource().sampleOf(items, 5)

    expect(items).toEqual(headwords)
  })
})

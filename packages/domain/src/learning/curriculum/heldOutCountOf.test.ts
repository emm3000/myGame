import { describe, expect, it } from 'vitest'
import type { BandWord } from './BandStart'
import { heldOutCountOf } from './heldOutCountOf'

const wordsCounting = (count: number, isChrome: boolean): ReadonlyArray<BandWord> =>
  Array.from({ length: count }, (_, position) => ({
    headword: `${isChrome ? 'chrome' : 'band'}-${position}`,
    isChrome,
  }))

describe('the count a band draw holds out', () => {
  it('holds out a tenth of the band words, rounded down', () => {
    expect(heldOutCountOf(wordsCounting(29, false))).toBe(2)
  })

  it('leaves the chrome words out of the tenth', () => {
    expect(heldOutCountOf([...wordsCounting(9, false), ...wordsCounting(5, true)])).toBe(0)
  })
})

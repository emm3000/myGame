import { isLiteralElement, isSelectElement, parse } from '@formatjs/icu-messageformat-parser'
import { describe, expect, it } from 'vitest'
import en from '../en.json'
import { refusalNotEnoughWords } from './generated/en'

const stableBranchOf = (pattern: string): string =>
  parse(pattern)
    .filter(isSelectElement)
    .filter(({ value }) => value === 'standing')
    .flatMap(({ options }) => options.stable?.value ?? [])
    .filter(isLiteralElement)
    .map(({ value }) => value)
    .join('')

describe('the English refusal for too few stable words', () => {
  it('reads them as words out of learning on the web and the api', () => {
    expect(refusalNotEnoughWords({ needed: 10, held: 9, standing: 'stable' })).toBe(
      'This level needs 10 words out of learning and you have 9. Study new lessons and review the words that are due.',
    )
  })

  it('reads them as words out of learning in the pattern Android formats', () => {
    expect(stableBranchOf(en['android.town.town_refusal_not_enough_words'])).toBe(
      'words out of learning',
    )
  })
})

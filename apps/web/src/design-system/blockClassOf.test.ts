import { describe, expect, it } from 'vitest'
import { blockClassOf } from './blockClassOf'

describe('blockClassOf', () => {
  it('changes the hue at each place of the run', () => {
    expect([0, 1, 2, 3].map(blockClassOf)).toEqual([
      'bg-block-peach',
      'bg-block-mint',
      'bg-block-periwinkle',
      'bg-block-lavender',
    ])
  })

  it('comes back to the first hue after the fourth', () => {
    expect(blockClassOf(4)).toBe('bg-block-peach')
  })
})

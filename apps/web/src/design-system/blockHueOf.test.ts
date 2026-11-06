import { describe, expect, it } from 'vitest'
import { blockHueOf } from './blockHueOf'

describe('blockHueOf', () => {
  it('changes the hue at each place of the run', () => {
    expect([0, 1, 2, 3].map(blockHueOf)).toEqual(['peach', 'mint', 'periwinkle', 'lavender'])
  })

  it('comes back to the first hue after the fourth', () => {
    expect(blockHueOf(4)).toBe('peach')
  })
})

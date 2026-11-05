import { expect, it } from 'vitest'
import { seasonMarkLineOf } from './seasonMarkLineOf'

it('writes no sign on a season mark at the neutral percent', () => {
  expect(seasonMarkLineOf('summer', 'wood', 100)).toBe('Verano: 0 % de madera')
})

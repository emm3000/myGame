import { expect, it } from 'vitest'
import { panelPlaceOf } from './panelPlaceOf'

it('places the panel after the row at two and at five columns', () => {
  expect([0, 2, 7, 14].map((position) => panelPlaceOf(position, 2, 15))).toEqual([1, 3, 7, 14])
  expect([0, 2, 7, 14].map((position) => panelPlaceOf(position, 5, 15))).toEqual([4, 4, 9, 14])
})

it('places the panel after the last tile when the last row is short', () => {
  expect(panelPlaceOf(12, 5, 13)).toBe(12)
  expect(panelPlaceOf(10, 5, 13)).toBe(12)
})

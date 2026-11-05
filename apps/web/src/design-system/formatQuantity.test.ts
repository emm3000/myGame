import { expect, it } from 'vitest'
import { formatQuantity } from './formatQuantity'

it('groups thousands with a narrow space that never breaks the line', () => {
  expect(formatQuantity(1388)).toBe('1\u202f388')
})

it('floors a fractional quantity', () => {
  expect(formatQuantity(5000.9)).toBe('5\u202f000')
})

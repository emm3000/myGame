import { expect, it } from 'vitest'
import { formatInstant } from './formatInstant'

const now = new Date(2026, 8, 28, 19, 0)

it('names only the hour of an instant from today', () => {
  expect(formatInstant(new Date(2026, 8, 28, 18, 42), now)).toBe('Hoy, 18:42')
})

it('names the day and the hour of an instant from an earlier day this year', () => {
  expect(formatInstant(new Date(2026, 8, 12, 9, 15), now)).toBe('12 sept, 09:15')
})

it('names the year of an instant from another year', () => {
  expect(formatInstant(new Date(2025, 8, 12, 9, 15), now)).toBe('12 sept 2025, 09:15')
})

it('pads the hour and the minute to two digits', () => {
  expect(formatInstant(new Date(2026, 0, 3, 7, 5), now)).toBe('3 ene, 07:05')
})

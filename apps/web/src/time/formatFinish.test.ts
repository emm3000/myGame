import { en, es } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { formatFinish } from './formatFinish'

const readAt = new Date(2026, 9, 6, 13, 50)

const minutes = (count: number): number => count * 60
const hours = (count: number): number => count * 3600

it('reads a finish under an hour as relative time alone', () => {
  expect(formatFinish(es, minutes(14), readAt)).toBe('14 min')
})

it('reads the whole minutes left', () => {
  expect(formatFinish(es, minutes(14) + 30, readAt)).toBe('14 min')
})

it('reads seconds alone in the last minute', () => {
  expect(formatFinish(es, 42, readAt)).toBe('0:42')
})

it('reads a finish exactly an hour away without the clock', () => {
  expect(formatFinish(es, hours(1), readAt)).toBe('1 h')
})

it('adds the clock end to a finish more than an hour away', () => {
  expect(formatFinish(es, hours(2) + minutes(14), readAt)).toBe('2 h 14 min · 16:04')
})

it('names tomorrow and a later date', () => {
  expect(formatFinish(es, hours(14) + minutes(20), readAt)).toBe('14 h 20 min · mañana 04:10')
  expect(formatFinish(es, hours(44) + minutes(5), new Date(2026, 9, 6, 12, 5))).toBe(
    '44 h 5 min · 8 oct 08:10',
  )
})

it('names tomorrow from the catalog it is given', () => {
  expect(formatFinish(en, hours(14) + minutes(20), readAt)).toBe('14 h 20 min · tomorrow 04:10')
})

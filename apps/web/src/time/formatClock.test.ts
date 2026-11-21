import { en } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { formatClock } from './formatClock'

const now = new Date(2026, 8, 28, 19, 0)

it('names tomorrow from the catalog it is given', () => {
  expect(formatClock(en, new Date(2026, 8, 29, 9, 50), now)).toBe('tomorrow 09:50')
})

it('names a later day in the language of the catalog it is given', () => {
  expect(formatClock(en, new Date(2026, 9, 5, 9, 50), now)).toBe('5 Oct 09:50')
})

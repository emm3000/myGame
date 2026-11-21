import { es } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { townSeasonEndsInOf } from './townSeasonEndsInOf'

it('counts a single day in the singular', () => {
  expect(townSeasonEndsInOf(es, 'fall', 86_400)).toBe('Otoño termina en 1 día')
})

it('counts whole days in the plural', () => {
  expect(townSeasonEndsInOf(es, 'fall', 3 * 86_400)).toBe('Otoño termina en 3 días')
})

it('counts the time left under a day', () => {
  expect(townSeasonEndsInOf(es, 'fall', 840)).toBe('Otoño termina en 14 min')
})

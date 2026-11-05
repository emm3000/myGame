import { expect, it } from 'vitest'
import es from '../es.json'
import { fiefNotEnoughPeasants } from './index'

it('names one needed peasant in the singular', () => {
  expect(fiefNotEnoughPeasants({ needed: 1, free: 0 })).toBe(
    'Necesitas 1 campesino libre y tienes 0.',
  )
})

it('names several needed peasants in the plural', () => {
  expect(fiefNotEnoughPeasants({ needed: 3, free: 2 })).toBe(
    'Necesitas 3 campesinos libres y tienes 2.',
  )
})

it('writes every Android plural count as an ungrouped number, never as #, which ICU groups', () => {
  const poundedAndroidKeys = Object.entries(es)
    .filter(([key]) => key.startsWith('android.'))
    .filter(([, pattern]) => pattern.replaceAll(/'[^']*'/g, '').includes('#'))
    .map(([key]) => key)

  expect(poundedAndroidKeys).toEqual([])
})

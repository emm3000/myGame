import { expect, it } from 'vitest'
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

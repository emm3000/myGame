import { expect, it } from 'vitest'
import { copy } from './copy'

it('names one needed peasant in the singular', () => {
  expect(copy.fief.notEnoughPeasants(1, 0)).toBe('Necesitas 1 campesino libre y tienes 0.')
})

it('names several needed peasants in the plural', () => {
  expect(copy.fief.notEnoughPeasants(3, 2)).toBe('Necesitas 3 campesinos libres y tienes 2.')
})

it('says te falta for a single shortfall of one', () => {
  expect(copy.fief.tooExpensive([{ amount: 1, resource: 'wood' }])).toBe('Te falta 1 de madera.')
})

it('says te faltan for two shortfalls of one each', () => {
  expect(
    copy.fief.tooExpensive([
      { amount: 1, resource: 'stone' },
      { amount: 1, resource: 'iron' },
    ]),
  ).toBe('Te faltan 1 de piedra y 1 de hierro.')
})

it('says te faltan for a single shortfall of several', () => {
  expect(copy.fief.tooExpensive([{ amount: 30, resource: 'wood' }])).toBe('Te faltan 30 de madera.')
})

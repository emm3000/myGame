import { expect, it } from 'vitest'
import { tooExpensiveLineOf } from './tooExpensiveLineOf'

it('says te falta for a single shortfall of one', () => {
  expect(tooExpensiveLineOf([{ amount: 1, resource: 'wood' }])).toBe('Te falta 1 de madera.')
})

it('says te faltan for two shortfalls of one each', () => {
  expect(
    tooExpensiveLineOf([
      { amount: 1, resource: 'stone' },
      { amount: 1, resource: 'iron' },
    ]),
  ).toBe('Te faltan 1 de piedra y 1 de hierro.')
})

it('says te faltan for a single shortfall of several', () => {
  expect(tooExpensiveLineOf([{ amount: 30, resource: 'wood' }])).toBe('Te faltan 30 de madera.')
})

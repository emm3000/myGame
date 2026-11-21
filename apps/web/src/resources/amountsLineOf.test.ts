import { en } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { amountsLineOf } from './amountsLineOf'

it('writes an amount from the catalog it is given', () => {
  expect(amountsLineOf(en, { money: 60, food: 0, power: 0, material: 0 })).toBe('60 money')
})

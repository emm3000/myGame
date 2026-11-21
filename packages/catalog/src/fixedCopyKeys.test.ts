import { expect, it } from 'vitest'
import en from '../en.json'
import { fixedCopyKeys } from './fixedCopyKeys'

it('lists only keys the catalog holds as fixed copy', () => {
  const unknownKeys = [...fixedCopyKeys].filter((key) => !Object.hasOwn(en, key))

  expect(unknownKeys).toEqual([])
})

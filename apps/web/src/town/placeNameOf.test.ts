import { en } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { placeNameOf } from './placeNameOf'

it('names a place from the catalog it is given', () => {
  expect(placeNameOf(en, 'school')).toBe('School')
})

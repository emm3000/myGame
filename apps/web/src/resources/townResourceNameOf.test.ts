import { en } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { townResourceNameOf } from './townResourceNameOf'

it('names a resource from the catalog it is given', () => {
  expect(townResourceNameOf(en, 'money')).toBe('money')
})

import type { TownOverview } from '@mygame/contracts/town'
import { describe, expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { wordArtOf } from './wordArtOf'

const buildings: TownOverview['buildings'] = knownTown.buildings

describe('wordArtOf', () => {
  it.each([
    ['home', '/art/places/homes-1.svg'],
    ['farm', '/art/places/farm-1.svg'],
    ['factory', '/art/places/factory-1.svg'],
    ['station', '/art/places/powerStation-1.svg'],
    ['storage', '/art/places/storage-1.svg'],
    ['school', '/art/places/school-1.svg'],
    ['office', '/art/places/office-1.svg'],
  ])('draws %s with its place', (word, art) => {
    expect(wordArtOf(word, buildings)).toBe(art)
  })

  it('draws no art for a word that names no place', () => {
    expect(wordArtOf('money', buildings)).toBeUndefined()
  })
})

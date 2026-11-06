import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { BuildingKindSchema } from '@mygame/contracts/town'
import { expect, it } from 'vitest'
import { placeArtOf } from './placeArtOf'

const publicDir = join(import.meta.dirname, '../../public')

it('draws a place not built with the art of level 1', () => {
  expect(placeArtOf('office', 0)).toBe('/art/places/office-1.svg')
})

it('shares one image between the two levels of a tier', () => {
  expect(placeArtOf('powerStation', 1)).toBe('/art/places/powerStation-1.svg')
  expect(placeArtOf('powerStation', 2)).toBe('/art/places/powerStation-1.svg')
  expect(placeArtOf('powerStation', 10)).toBe('/art/places/powerStation-5.svg')
})

const levels = Array.from({ length: 10 }, (_, index) => index + 1)

it('resolves every place from level 1 to 10 to a file under public/art', () => {
  const missing = BuildingKindSchema.options
    .flatMap((place) => levels.map((level) => placeArtOf(place, level)))
    .filter((src) => !existsSync(join(publicDir, src)))

  expect(missing).toEqual([])
})

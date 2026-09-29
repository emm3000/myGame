import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { BuildingKindSchema } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { buildingArtOf } from './buildingArtOf'

const publicDir = join(import.meta.dirname, '../../public')

it('shows no building art at level 0', () => {
  expect(buildingArtOf('quarry', 0)).toBeUndefined()
})

it('shares one image between the two levels of a tier', () => {
  expect(buildingArtOf('farm', 1)).toBe('/art/buildings/farm-1.png')
  expect(buildingArtOf('farm', 2)).toBe('/art/buildings/farm-1.png')
  expect(buildingArtOf('farm', 9)).toBe('/art/buildings/farm-5.png')
  expect(buildingArtOf('farm', 10)).toBe('/art/buildings/farm-5.png')
})

const levels = Array.from({ length: 10 }, (_, index) => index + 1)

const buildingsWithArt = BuildingKindSchema.options.filter((building) =>
  levels.some((level) => buildingArtOf(building, level) !== undefined),
)

it('shows no library art at any level', () => {
  expect(levels.map((level) => buildingArtOf('library', level))).toEqual(
    levels.map(() => undefined),
  )
})

it('shows no barracks art at any level', () => {
  expect(levels.map((level) => buildingArtOf('barracks', level))).toEqual(
    levels.map(() => undefined),
  )
})

it('ships art for every building but the library and the barracks', () => {
  expect(buildingsWithArt).toEqual(['sawmill', 'quarry', 'ironMine', 'farm', 'warehouse'])
})

it('resolves every building with art from level 1 to 10 to a file under public/art', () => {
  const missing = buildingsWithArt
    .flatMap((building) => levels.map((level) => buildingArtOf(building, level)))
    .filter((src) => src === undefined || !existsSync(join(publicDir, src)))

  expect(missing).toEqual([])
})

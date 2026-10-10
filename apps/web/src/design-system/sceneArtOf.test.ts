import { TerrainSchema } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { sceneArtOf } from './sceneArtOf'

it('answers no raster scene for any terrain', () => {
  const sources = TerrainSchema.options.map((terrain) => sceneArtOf(terrain))

  expect(sources).toEqual([undefined, undefined, undefined])
})

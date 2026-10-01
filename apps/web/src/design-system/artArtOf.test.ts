import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ArtKindSchema } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { artArtOf } from './artArtOf'

const publicDir = join(import.meta.dirname, '../../public')

it('resolves every art to a file under public/art', () => {
  const sources = ArtKindSchema.options.map((art) => artArtOf(art))

  expect(sources).toEqual(['/art/arts/smithing.png', '/art/arts/masonry.png'])
  expect(sources.filter((src) => !existsSync(join(publicDir, src)))).toEqual([])
})

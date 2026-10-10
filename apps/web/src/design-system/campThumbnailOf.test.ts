import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { campThumbnailOf } from './campThumbnailOf'

const publicDir = join(import.meta.dirname, '../../public')

it('resolves every camp tier thumbnail to a file under public/art', () => {
  const sources = ([1, 2, 3] as const).map((tier) => campThumbnailOf(tier))

  expect(sources).toEqual([
    '/art/camps/camp-1-96.webp',
    '/art/camps/camp-2-96.webp',
    '/art/camps/camp-3-96.webp',
  ])
  expect(sources.filter((src) => !existsSync(join(publicDir, src)))).toEqual([])
})

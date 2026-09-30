import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { campArtOf } from './campArtOf'

const publicDir = join(import.meta.dirname, '../../public')

it('resolves every camp tier to a file under public/art', () => {
  const sources = ([1, 2, 3] as const).map((tier) => campArtOf(tier))

  expect(sources).toEqual([
    '/art/camps/camp-1.png',
    '/art/camps/camp-2.png',
    '/art/camps/camp-3.png',
  ])
  expect(sources.filter((src) => !existsSync(join(publicDir, src)))).toEqual([])
})

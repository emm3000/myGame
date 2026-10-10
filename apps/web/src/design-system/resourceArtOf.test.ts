import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ResourceKindSchema } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { resourceArtOf } from './resourceArtOf'

const publicDir = join(import.meta.dirname, '../../public')

it('resolves every resource to a derivative under public/art', () => {
  const sources = ResourceKindSchema.options.map((kind) => resourceArtOf(kind))

  expect(sources).toEqual([
    '/art/resources/wood-1-96.webp',
    '/art/resources/stone-1-96.webp',
    '/art/resources/iron-1-96.webp',
    '/art/resources/gold-1-96.webp',
    '/art/resources/food-1-96.webp',
  ])
  expect(sources.filter((src) => src === undefined || !existsSync(join(publicDir, src)))).toEqual(
    [],
  )
})

it('lists the peasants art only once its derivative is under public/art', () => {
  const derivative = '/art/resources/peasants-1-96.webp'

  expect(resourceArtOf('peasants')).toBe(
    existsSync(join(publicDir, derivative)) ? derivative : undefined,
  )
})

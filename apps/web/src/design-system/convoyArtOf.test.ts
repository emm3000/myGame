import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { convoyArtOf } from './convoyArtOf'

const publicDir = join(import.meta.dirname, '../../public')

it('resolves the convoy to a file under public/art', () => {
  expect(convoyArtOf()).toBe('/art/convoys/convoy.png')
  expect(existsSync(join(publicDir, convoyArtOf()))).toBe(true)
})

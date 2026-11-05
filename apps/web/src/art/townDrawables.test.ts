import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { artProblemsOf } from './artProblemsOf'
import { townDrawablesOf } from './townDrawablesOf'

const drawables = townDrawablesOf()

describe('the town art', () => {
  for (const drawable of drawables) {
    it(`keeps ${basename(drawable.sourcePath)} to the art bible's rules`, () => {
      expect(artProblemsOf(drawable.svg)).toEqual([])
    })

    it(`keeps ${basename(drawable.path)} as converted from ${basename(drawable.sourcePath)}`, () => {
      expect(existsSync(drawable.path) ? readFileSync(drawable.path, 'utf8') : 'missing').toBe(
        drawable.contents,
      )
    })
  }

  it('keeps no town drawable without its svg source', () => {
    const directory = dirname(drawables[0]?.path ?? '')
    const converted = drawables.map((drawable) => basename(drawable.path)).sort()
    const committed = readdirSync(directory)
      .filter((fileName) => /^designsystem_(place|waste)_/.test(fileName))
      .sort()

    expect(committed).toEqual(converted)
  })
})

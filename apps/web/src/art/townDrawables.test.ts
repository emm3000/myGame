import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { artProblemsOf } from './artProblemsOf'
import { townArtOf, townDrawablesOf } from './townDrawablesOf'

const drawables = townDrawablesOf()

const contentsOf = (name: string): string =>
  drawables.find((drawable) => basename(drawable.path) === name)?.contents ?? ''

const pathCountOf = (name: string): number => [...contentsOf(name).matchAll(/<path/g)].length

describe('the town art', () => {
  for (const { sourcePath, svg } of townArtOf()) {
    it(`keeps ${basename(sourcePath)} to the art bible's rules`, () => {
      expect(artProblemsOf(svg)).toEqual([])
    })
  }

  for (const drawable of drawables) {
    it(`keeps ${basename(drawable.path)} as converted from ${basename(drawable.sourcePath)}`, () => {
      expect(existsSync(drawable.path) ? readFileSync(drawable.path, 'utf8') : 'missing').toBe(
        drawable.contents,
      )
    })
  }

  it('writes one drawable per place and level, and one word silhouette per place', () => {
    expect(drawables.length).toBe(84)
  })

  it('trims a word silhouette to its shapes', () => {
    expect(contentsOf('designsystem_word_homes.xml')).toContain(
      'android:viewportWidth="84"\n    android:viewportHeight="66"',
    )
  })

  it('moves a word silhouette to the corner of its trimmed viewport', () => {
    expect(contentsOf('designsystem_word_homes.xml')).toContain(
      '<group android:translateX="-8" android:translateY="-74">',
    )
  })

  it('keeps a word silhouette at the scale of the place card', () => {
    expect(contentsOf('designsystem_word_homes.xml')).toContain('android:height="74.366dp"')
  })

  it('draws no window on a word silhouette', () => {
    expect(pathCountOf('designsystem_word_storage.xml')).toBe(1)
  })

  it('names a two-word place in snake case', () => {
    expect(
      drawables.some(
        (drawable) => basename(drawable.path) === 'designsystem_place_power_station_3.xml',
      ),
    ).toBe(true)
  })

  it('cuts a place at level 0 down to its silhouette', () => {
    expect(pathCountOf('designsystem_place_storage_0.xml')).toBe(1)
  })

  it('adds one window per level', () => {
    expect(pathCountOf('designsystem_place_storage_4.xml')).toBe(5)
  })

  it('keeps all ten windows at level 10', () => {
    expect(pathCountOf('designsystem_place_storage_10.xml')).toBe(11)
  })

  it('keeps no town drawable without its svg source', () => {
    const directory = dirname(drawables[0]?.path ?? '')
    const converted = drawables.map((drawable) => basename(drawable.path)).sort()
    const committed = readdirSync(directory)
      .filter((fileName) => /^designsystem_(place|waste|word)_/.test(fileName))
      .sort()

    expect(committed).toEqual(converted)
  })
})

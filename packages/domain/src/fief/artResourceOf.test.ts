import { describe, expect, it } from 'vitest'
import type { ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'
import { artResourceOf } from './artResourceOf'

const firstLevelOf = (art: ArtLevel['art'], resource: ArtLevel['resource']): ArtLevel => ({
  art,
  level: 1,
  cost: { wood: 0, stone: 0, iron: 100, gold: 50, food: 0 },
  durationSeconds: 600,
  requiredLibraryLevel: 1,
  resource,
  ratePercent: 5,
})

const artCatalog = (arts: Partial<Record<string, ArtLevel>>): BuildingCatalog => ({
  levelOf: () => undefined,
  artLevelOf: (art, level) => arts[`${art}:${level}`],
  fiefSettings: () => {
    throw new Error('the art resource never reads the fief settings')
  },
})

describe('artResourceOf', () => {
  it('answers the resource the first level of the art raises', () => {
    const catalog = artCatalog({ 'smithing:1': firstLevelOf('smithing', 'wood') })

    expect(artResourceOf('smithing', catalog)).toEqual({ ok: true, value: 'wood' })
  })

  it('refuses an art whose first level the catalog does not know', () => {
    const catalog = artCatalog({})

    expect(artResourceOf('masonry', catalog)).toEqual({
      ok: false,
      error: { kind: 'UnknownArtLevel', art: 'masonry', level: 1 },
    })
  })

  it('refuses a first level that names another art', () => {
    const catalog = artCatalog({ 'masonry:1': firstLevelOf('smithing', 'iron') })

    expect(artResourceOf('masonry', catalog)).toEqual({
      ok: false,
      error: { kind: 'UnknownArtLevel', art: 'masonry', level: 1 },
    })
  })
})

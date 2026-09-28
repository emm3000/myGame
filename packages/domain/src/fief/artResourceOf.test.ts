import { describe, expect, it } from 'vitest'
import type { ArtLevel, BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import { neutralSeasons } from '../testing/neutralSeasons'
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

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  seasons: neutralSeasons,
}

const artCatalog = (arts: Partial<Record<string, ArtLevel>>): BuildingCatalog => ({
  levelOf: () => undefined,
  artLevelOf: (art, level) => arts[`${art}:${level}`],
  fiefSettings: () => fiefSettings,
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

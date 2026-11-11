import { assert, describe, expect, it } from 'vitest'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { readRegionMap } from './readRegionMap'
import type { Town } from './Town'

const storedAt = plainTownSettings.seasons.epoch

const ownTown = townOf({ area: 2, site: 4, storedAt })

const neighborTown = townOf({
  id: 'town-2',
  playerId: 'player-2',
  name: 'Cedar Creek',
  area: 3,
  site: 7,
  storedAt,
})

const mapOf = (
  area: number | undefined,
  towns: ReadonlyArray<Town> = [ownTown, neighborTown],
): ReturnType<typeof readRegionMap> =>
  readRegionMap(area === undefined ? { playerId: 'player-1' } : { playerId: 'player-1', area }, {
    map: inMemoryRegionMap(towns),
    catalog: townCatalogOf(),
  })

describe('readRegionMap', () => {
  it("opens the map on the town's own area", async () => {
    const map = await mapOf(undefined)

    assert(map.ok)
    expect([map.value.region, map.value.area, map.value.sites.length]).toEqual([1, 2, 15])
    expect(map.value.sites.filter((site) => site.town !== undefined)).toEqual([
      { site: 4, town: { name: 'Maple Hill', isOwn: true } },
    ])
  })

  it('shows the towns of another area as not own', async () => {
    const map = await mapOf(3)

    assert(map.ok)
    expect(map.value.sites.filter((site) => site.town !== undefined)).toEqual([
      { site: 7, town: { name: 'Cedar Creek', isOwn: false } },
    ])
  })

  it('browses to one past the last area holding a town', async () => {
    const maps = await Promise.all([mapOf(4), mapOf(5), mapOf(0), mapOf(1.5)])

    expect(maps.map((map) => (map.ok ? map.value.lastArea : map.error))).toEqual([
      4,
      { kind: 'AreaNotFound', area: 5 },
      { kind: 'AreaNotFound', area: 0 },
      { kind: 'AreaNotFound', area: 1.5 },
    ])
  })

  it("sets an area's terrain from its number", async () => {
    const maps = await Promise.all([mapOf(1), mapOf(2), mapOf(3), mapOf(4)])

    expect(maps.map((map) => (map.ok ? map.value.terrain : map.error))).toEqual([
      'fields',
      'river',
      'hills',
      'fields',
    ])
  })

  it('refuses a player who holds no town', async () => {
    const map = await mapOf(undefined, [neighborTown])

    expect(map).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-1' } })
  })
})

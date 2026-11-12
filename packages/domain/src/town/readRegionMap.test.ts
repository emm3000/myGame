import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryCleanUps } from '../testing/inMemoryCleanUps'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { CleanUp } from './CleanUp'
import { readRegionMap } from './readRegionMap'
import type { Town } from './Town'

const MILLISECONDS_PER_HOUR = 3_600_000

const storedAt = plainTownSettings.seasons.epoch

const readAt = Instant.fromEpochMilliseconds(
  storedAt.epochMilliseconds + 24 * MILLISECONDS_PER_HOUR,
)

const hoursBeforeRead = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(readAt.epochMilliseconds - hours * MILLISECONDS_PER_HOUR)

const frozenClock: Clock = { now: () => readAt }

const mediumSiteCleanedSixHoursAgo: CleanUp = {
  townId: 'town-2',
  sentAt: hoursBeforeRead(7),
  site: { region: 1, area: 2, site: 2 },
  cleanedAt: hoursBeforeRead(6),
}

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
  cleanUps: ReadonlyArray<CleanUp> = [],
): ReturnType<typeof readRegionMap> =>
  readRegionMap(area === undefined ? { playerId: 'player-1' } : { playerId: 'player-1', area }, {
    map: inMemoryRegionMap(towns),
    cleanUps: inMemoryCleanUps(cleanUps),
    catalog: townCatalogOf(),
    clock: frozenClock,
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

  it('shows each free waste site with its size and its waste at the read', async () => {
    const map = await mapOf(2, [ownTown, neighborTown], [mediumSiteCleanedSixHoursAgo])

    assert(map.ok)
    expect(
      map.value.sites.flatMap(({ site, waste }) =>
        waste === undefined ? [] : [{ site, ...waste }],
      ),
    ).toEqual([
      { site: 1, size: 1, waste: 6 },
      { site: 2, size: 2, waste: 7 },
      { site: 10, size: 3, waste: 40 },
      { site: 15, size: 2, waste: 15 },
    ])
  })

  it('shows no waste on a site a town holds', async () => {
    const map = await mapOf(2)

    assert(map.ok)
    expect(map.value.sites.find((site) => site.site === 4)).toEqual({
      site: 4,
      town: { name: 'Maple Hill', isOwn: true },
      waste: undefined,
    })
  })

  it('refuses a player who holds no town', async () => {
    const map = await mapOf(undefined, [neighborTown])

    expect(map).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-1' } })
  })
})

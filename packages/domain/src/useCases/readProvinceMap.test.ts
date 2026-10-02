import { assert, describe, expect, it } from 'vitest'
import type { CampBattle } from '../camp/CampBattle'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { type HeldPlot, inMemoryKingdomMap } from '../testing/inMemoryKingdomMap'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { type ReadProvinceMapDependencies, readProvinceMap } from './readProvinceMap'

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 4,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const viewerFief: HeldPlot = {
  fiefId: 'viewer-fief',
  playerId: 'viewer',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 2, plot: 3 },
}

const neighbourFief: HeldPlot = {
  fiefId: 'neighbour-fief',
  playerId: 'neighbour',
  name: 'Peña Alta',
  address: { kingdom: 1, province: 2, plot: 1 },
}

const farFief: HeldPlot = {
  fiefId: 'far-fief',
  playerId: 'far',
  name: 'Robledal',
  address: { kingdom: 1, province: 5, plot: 2 },
}

const foreignFief: HeldPlot = {
  fiefId: 'foreigner-fief',
  playerId: 'foreigner',
  name: 'Torre Lejana',
  address: { kingdom: 2, province: 2, plot: 2 },
}

const deepForeignFief: HeldPlot = {
  fiefId: 'deep-foreigner-fief',
  playerId: 'deep-foreigner',
  name: 'Hondonada',
  address: { kingdom: 2, province: 8, plot: 1 },
}

const kingdomMap = inMemoryKingdomMap([
  viewerFief,
  neighbourFief,
  farFief,
  foreignFief,
  deepForeignFief,
])

const readInstant = Instant.fromEpochMilliseconds(86_400_000)

const hoursBeforeRead = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(readInstant.epochMilliseconds - hours * 3_600_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const dependenciesOf = (battles: ReadonlyArray<CampBattle> = []): ReadProvinceMapDependencies => ({
  map: kingdomMap,
  catalog,
  camps: inMemoryCampRegistry(battles),
  clock: frozenClock(readInstant),
})

const tierTwoCampPlot = { kingdom: 1, province: 3, plot: 1 }

const plotTheHashPassesOver = { kingdom: 1, province: 3, plot: 2 }

describe('readProvinceMap', () => {
  it('opens the province of the viewer fief when none is named', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.kingdom).toBe(1)
    expect(read.value.province).toBe(2)
  })

  it('lists every plot of the province in order', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots.map(({ plot }) => plot)).toEqual([1, 2, 3, 4])
  })

  it('marks the fief of the viewer and no other', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots[2]?.fief).toEqual({ name: 'Vado Viejo', isOwn: true })
    expect(read.value.plots[0]?.fief).toEqual({ name: 'Peña Alta', isOwn: false })
  })

  it('leaves a plot no fief holds free', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots[1]?.fief).toBeUndefined()
    expect(read.value.plots[3]?.fief).toBeUndefined()
  })

  it('gives every plot the terrain of its province', async () => {
    const uplands = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )
    const ridges = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 3 },
      dependenciesOf(),
    )

    assert(uplands.ok)
    assert(ridges.ok)
    expect(uplands.value.terrain).toBe('uplands')
    expect(ridges.value.terrain).toBe('ridges')
  })

  it('bounds the map one province past the last one holding a fief', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.lastProvince).toBe(6)
  })

  it('opens the province at the bound, which no fief holds yet', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 6 },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots.every(({ fief }) => fief === undefined)).toBe(true)
  })

  it('refuses a province beyond the bound', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 7 },
      dependenciesOf(),
    )

    expect(read).toEqual({
      ok: false,
      error: { kind: 'ProvinceNotFound', province: 7, lastProvince: 6 },
    })
  })

  it('refuses a province below one', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 0 },
      dependenciesOf(),
    )

    expect(read).toEqual({
      ok: false,
      error: { kind: 'ProvinceNotFound', province: 0, lastProvince: 6 },
    })
  })

  it('refuses a province that is not a whole number', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 2.5 },
      dependenciesOf(),
    )

    expect(read).toEqual({
      ok: false,
      error: { kind: 'ProvinceNotFound', province: 2.5, lastProvince: 6 },
    })
  })

  it('opens the map on the province of the fief it is given', async () => {
    const viewerSecondFief: HeldPlot = {
      fiefId: 'viewer-second-fief',
      playerId: 'viewer',
      name: 'Robledo Nuevo',
      address: { kingdom: 1, province: 4, plot: 3 },
    }
    const dependencies = {
      ...dependenciesOf(),
      map: inMemoryKingdomMap([viewerFief, viewerSecondFief, farFief]),
    }

    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-second-fief' },
      dependencies,
    )

    assert(read.ok)
    expect(read.value.province).toBe(4)
  })

  it('refuses the map of a fief of another player', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'neighbour-fief' },
      dependenciesOf(),
    )

    expect(read).toEqual({ ok: false, error: { kind: 'FiefNotFound', fiefId: 'neighbour-fief' } })
  })

  it('refuses an unknown fief', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'unknown-fief' },
      dependenciesOf(),
    )

    expect(read).toEqual({ ok: false, error: { kind: 'FiefNotFound', fiefId: 'unknown-fief' } })
  })

  it('bounds and lists only the kingdom of the viewer', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.kingdom).toBe(1)
    expect(read.value.lastProvince).toBe(6)
    expect(read.value.plots[1]?.fief).toBeUndefined()
  })

  it('opens the kingdom of a viewer outside the first one', async () => {
    const read = await readProvinceMap(
      { playerId: 'foreigner', fiefId: 'foreigner-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.kingdom).toBe(2)
    expect(read.value.lastProvince).toBe(9)
    expect(read.value.plots.map(({ fief }) => fief)).toEqual([
      undefined,
      { name: 'Torre Lejana', isOwn: true },
      undefined,
      undefined,
    ])
  })

  it('answers a camp at its max on a plot never fought', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 3 },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots[tierTwoCampPlot.plot - 1]?.camp).toEqual({ tier: 2, strength: 15 })
  })

  it('answers a beaten camp regrown by the read', async () => {
    const beatenFourHoursAgo = { ...tierTwoCampPlot, strength: 0, foughtAt: hoursBeforeRead(4) }

    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 3 },
      dependenciesOf([beatenFourHoursAgo]),
    )

    assert(read.ok)
    expect(read.value.plots[tierTwoCampPlot.plot - 1]?.camp).toEqual({ tier: 2, strength: 5 })
  })

  it('answers no camp on a held plot', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief' },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots[neighbourFief.address.plot - 1]?.camp).toBeUndefined()
  })

  it('answers no camp on a plot the hash passes over', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', fiefId: 'viewer-fief', province: 3 },
      dependenciesOf(),
    )

    assert(read.ok)
    expect(read.value.plots[plotTheHashPassesOver.plot - 1]?.camp).toBeUndefined()
  })
})

import { assert, describe, expect, it } from 'vitest'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import { type HeldPlot, inMemoryKingdomMap } from '../testing/inMemoryKingdomMap'
import { readProvinceMap } from './readProvinceMap'

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
}

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const viewerFief: HeldPlot = {
  playerId: 'viewer',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 2, plot: 3 },
}

const neighbourFief: HeldPlot = {
  playerId: 'neighbour',
  name: 'Peña Alta',
  address: { kingdom: 1, province: 2, plot: 1 },
}

const farFief: HeldPlot = {
  playerId: 'far',
  name: 'Robledal',
  address: { kingdom: 1, province: 5, plot: 2 },
}

const kingdomMap = inMemoryKingdomMap([viewerFief, neighbourFief, farFief])

describe('readProvinceMap', () => {
  it('opens the province of the viewer fief when none is named', async () => {
    const read = await readProvinceMap({ playerId: 'viewer' }, { map: kingdomMap, catalog })

    assert(read.ok)
    expect(read.value.kingdom).toBe(1)
    expect(read.value.province).toBe(2)
  })

  it('lists every plot of the province in order', async () => {
    const read = await readProvinceMap({ playerId: 'viewer' }, { map: kingdomMap, catalog })

    assert(read.ok)
    expect(read.value.plots.map(({ plot }) => plot)).toEqual([1, 2, 3, 4])
  })

  it('marks the fief of the viewer and no other', async () => {
    const read = await readProvinceMap({ playerId: 'viewer' }, { map: kingdomMap, catalog })

    assert(read.ok)
    expect(read.value.plots[2]?.fief).toEqual({ name: 'Vado Viejo', isOwn: true })
    expect(read.value.plots[0]?.fief).toEqual({ name: 'Peña Alta', isOwn: false })
  })

  it('leaves a plot no fief holds free', async () => {
    const read = await readProvinceMap({ playerId: 'viewer' }, { map: kingdomMap, catalog })

    assert(read.ok)
    expect(read.value.plots[1]?.fief).toBeUndefined()
    expect(read.value.plots[3]?.fief).toBeUndefined()
  })

  it('gives every plot the terrain of its province', async () => {
    const uplands = await readProvinceMap({ playerId: 'viewer' }, { map: kingdomMap, catalog })
    const ridges = await readProvinceMap(
      { playerId: 'viewer', province: 3 },
      { map: kingdomMap, catalog },
    )

    assert(uplands.ok)
    assert(ridges.ok)
    expect(uplands.value.terrain).toBe('uplands')
    expect(ridges.value.terrain).toBe('ridges')
  })

  it('bounds the map one province past the last one holding a fief', async () => {
    const read = await readProvinceMap({ playerId: 'viewer' }, { map: kingdomMap, catalog })

    assert(read.ok)
    expect(read.value.lastProvince).toBe(6)
  })

  it('opens the province at the bound, which no fief holds yet', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', province: 6 },
      { map: kingdomMap, catalog },
    )

    assert(read.ok)
    expect(read.value.plots.every(({ fief }) => fief === undefined)).toBe(true)
  })

  it('refuses a province beyond the bound', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', province: 7 },
      { map: kingdomMap, catalog },
    )

    expect(read).toEqual({
      ok: false,
      error: { kind: 'ProvinceNotFound', province: 7, lastProvince: 6 },
    })
  })

  it('refuses a province below one', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', province: 0 },
      { map: kingdomMap, catalog },
    )

    expect(read).toEqual({
      ok: false,
      error: { kind: 'ProvinceNotFound', province: 0, lastProvince: 6 },
    })
  })

  it('refuses a province that is not a whole number', async () => {
    const read = await readProvinceMap(
      { playerId: 'viewer', province: 2.5 },
      { map: kingdomMap, catalog },
    )

    expect(read).toEqual({
      ok: false,
      error: { kind: 'ProvinceNotFound', province: 2.5, lastProvince: 6 },
    })
  })

  it('refuses a viewer without a fief', async () => {
    const read = await readProvinceMap({ playerId: 'landless' }, { map: kingdomMap, catalog })

    expect(read).toEqual({ ok: false, error: { kind: 'FiefNotFound', playerId: 'landless' } })
  })
})

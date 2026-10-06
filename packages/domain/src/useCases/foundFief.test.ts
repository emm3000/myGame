import { assert, describe, expect, it } from 'vitest'
import { Coordinates } from '../fief/Coordinates'
import { Fief, type StoredFief } from '../fief/Fief'
import { FiefName } from '../fief/FiefName'
import { noStoreFull } from '../fief/FullSince'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err, ok } from '../Result'
import {
  type InMemoryFiefRepository,
  inMemoryFiefRepository,
} from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { sequentialIds } from '../testing/sequentialIds'
import { Instant } from '../time/Instant'
import { foundFief } from './foundFief'

const foundingInstant = Instant.fromEpochMilliseconds(86_400_000)

const frozenClock: Clock = { now: () => foundingInstant }

const fiefSettings = (plotsPerProvince: number): FiefSettings => ({
  startingStocks: { wood: 40, stone: 30, iron: 20, gold: 5, food: 35 },
  startingCapacity: 900,
  basePeasantSupply: 6,
  plotsPerProvince,
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
})

const inMemoryCatalog = (settings: FiefSettings): BuildingCatalog => ({
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => settings,
})

const raceLostFiefRepository = (): InMemoryFiefRepository => ({
  savedFiefs: () => [],
  occupiedPlots: async () => [],
  holdsFief: async () => false,
  fiefsOf: async () => [],
  foundingsOnTheRoadOf: async () => 0,
  storedFiefOf: () => undefined,
  fiefOf: async () => ok(undefined),
  save: async (fief) => err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates }),
})

const coordinatesAt = (kingdom: number, province: number, plot: number): Coordinates => {
  const result = Coordinates.create(kingdom, province, plot)
  assert(result.ok)
  return result.value
}

const neighbourFief = (playerId: string, coordinates: Coordinates): Fief => {
  const name = FiefName.create('Neighbour')
  assert(name.ok)
  return Fief.found({
    id: `fief-of-${playerId}`,
    playerId,
    name: name.value,
    coordinates,
    startingStocks: fiefSettings(3).startingStocks,
    at: foundingInstant,
  })
}

const founderOnTheRoad = (recalledAt: Instant | undefined): Fief => {
  const departedAt = Instant.fromEpochMilliseconds(86_000_000)
  const founder: StoredFief = {
    id: 'founder-fief',
    playerId: 'founder',
    name: 'Peña Alta',
    address: { kingdom: 1, province: 1, plot: 1 },
    stocks: { wood: 40, stone: 30, iron: 20, gold: 5, food: 35 },
    storedAt: departedAt,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 5,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
    slot: { kind: 'idle' },
    buildQueue: [],
    fullSince: noStoreFull,
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: {
      kind: 'away',
      order: 'found',
      name: 'Sotoverde',
      province: 1,
      plot: 2,
      units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
      stayHours: 0,
      departedAt,
      oneWaySeconds: 900,
      loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
      ...(recalledAt === undefined ? {} : { recalledAt }),
    },
  }
  const restored = Fief.restore(founder)
  assert(restored.ok)
  return restored.value
}

describe('foundFief', () => {
  it('takes the lowest free plot', async () => {
    const fiefs = inMemoryFiefRepository([
      neighbourFief('first-neighbour', coordinatesAt(1, 1, 1)),
      neighbourFief('second-neighbour', coordinatesAt(1, 1, 3)),
    ])

    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs,
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.coordinates).toEqual(coordinatesAt(1, 1, 2))
  })

  it('skips a reserved plot when founding a fief at sign-up', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: inMemoryFiefRepository([founderOnTheRoad(undefined)]),
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.coordinates).toEqual(coordinatesAt(1, 1, 3))
  })

  it('offers a plot again once its founding is recalled', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: inMemoryFiefRepository([
          founderOnTheRoad(Instant.fromEpochMilliseconds(86_300_000)),
        ]),
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.coordinates).toEqual(coordinatesAt(1, 1, 2))
  })

  it('opens the next province once every plot of the last one is taken', async () => {
    const fiefs = inMemoryFiefRepository([
      neighbourFief('first-neighbour', coordinatesAt(1, 1, 1)),
      neighbourFief('second-neighbour', coordinatesAt(1, 1, 2)),
    ])

    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs,
        catalog: inMemoryCatalog(fiefSettings(2)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.coordinates).toEqual(coordinatesAt(1, 2, 1))
  })

  it('gives the province its terrain by rotation', async () => {
    const fiefs = inMemoryFiefRepository([])
    const dependencies = {
      fiefs,
      catalog: inMemoryCatalog(fiefSettings(1)),
      clock: frozenClock,
      ids: sequentialIds(),
    }

    const terrains = []
    for (const playerId of ['first', 'second', 'third', 'fourth']) {
      const result = await foundFief({ playerId, name: 'Vado Viejo' }, dependencies)
      assert(result.ok)
      terrains.push(result.value.terrain)
    }

    expect(terrains).toEqual(['lowlands', 'uplands', 'ridges', 'lowlands'])
  })

  it('stores the starting stocks at the clock instant', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs,
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    const [stored] = fiefs.savedFiefs()
    assert(stored !== undefined)
    expect(stored.stocks).toEqual({ wood: 40, stone: 30, iron: 20, gold: 5, food: 35 })
    expect(stored.storedAt).toBe(foundingInstant)
  })

  it('founds the fief with every building at level zero', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: inMemoryFiefRepository([]),
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.buildingLevels).toEqual({
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 0,
    })
  })

  it('founds the fief with an idle slot', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: inMemoryFiefRepository([]),
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.slot).toEqual({ kind: 'idle' })
  })

  it('names the fief as the player chose', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: inMemoryFiefRepository([]),
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    assert(result.ok)
    expect(result.value.name.value).toBe('Vado Viejo')
    expect(result.value.id).toBe('fief-1')
    expect(result.value.playerId).toBe('newcomer')
  })

  it('refuses a blank fief name', async () => {
    const fiefs = inMemoryFiefRepository([])
    const dependencies = {
      fiefs,
      catalog: inMemoryCatalog(fiefSettings(3)),
      clock: frozenClock,
      ids: sequentialIds(),
    }

    const empty = await foundFief({ playerId: 'newcomer', name: '' }, dependencies)
    const blank = await foundFief({ playerId: 'newcomer', name: ' \t ' }, dependencies)

    expect(empty).toEqual({ ok: false, error: { kind: 'BlankFiefName' } })
    expect(blank).toEqual({ ok: false, error: { kind: 'BlankFiefName' } })
    expect(fiefs.savedFiefs()).toEqual([])
  })

  it('refuses a second fief for the same player', async () => {
    const fiefs = inMemoryFiefRepository([neighbourFief('holder', coordinatesAt(1, 1, 1))])

    const result = await foundFief(
      { playerId: 'holder', name: 'Vado Viejo' },
      {
        fiefs,
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'PlayerAlreadyHoldsFief', playerId: 'holder' },
    })
    expect(fiefs.savedFiefs()).toHaveLength(1)
  })

  it('refuses a blank name before consulting the fiefs', async () => {
    const fiefs = inMemoryFiefRepository([neighbourFief('holder', coordinatesAt(1, 1, 1))])

    const result = await foundFief(
      { playerId: 'holder', name: '   ' },
      {
        fiefs,
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'BlankFiefName' } })
  })

  it('reports a plot another founding took first', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: raceLostFiefRepository(),
        catalog: inMemoryCatalog(fiefSettings(3)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'CoordinatesTaken', coordinates: coordinatesAt(1, 1, 1) },
    })
  })

  it('refuses a province without plots instead of searching forever', async () => {
    const result = await foundFief(
      { playerId: 'newcomer', name: 'Vado Viejo' },
      {
        fiefs: inMemoryFiefRepository([]),
        catalog: inMemoryCatalog(fiefSettings(0)),
        clock: frozenClock,
        ids: sequentialIds(),
      },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'InvalidPlotsPerProvince', plotsPerProvince: 0 },
    })
  })
})

import { assert, describe, expect, it } from 'vitest'
import { Coordinates } from '../fief/Coordinates'
import { Fief } from '../fief/Fief'
import { FiefName } from '../fief/FiefName'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { IdGenerator } from '../ports/IdGenerator'
import { err, ok } from '../Result'
import { Instant } from '../time/Instant'
import { foundFief } from './foundFief'

const foundingInstant = Instant.fromEpochMilliseconds(86_400_000)

const frozenClock: Clock = { now: () => foundingInstant }

const fiefSettings = (plotsPerProvince: number): FiefSettings => ({
  startingStocks: { wood: 40, stone: 30, iron: 20, gold: 5, food: 35 },
  startingCapacity: 900,
  basePeasantSupply: 6,
  plotsPerProvince,
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
})

const inMemoryCatalog = (settings: FiefSettings): BuildingCatalog => ({
  levelOf: () => undefined,
  fiefSettings: () => settings,
})

const sequentialIds = (): IdGenerator => {
  let issued = 0
  return {
    newId: () => {
      issued += 1
      return `fief-${issued}`
    },
  }
}

type InMemoryFiefRepository = FiefRepository & {
  savedFiefs(): ReadonlyArray<Fief>
}

const inMemoryFiefRepository = (existing: ReadonlyArray<Fief>): InMemoryFiefRepository => {
  const fiefs = [...existing]
  return {
    savedFiefs: () => [...fiefs],
    occupiedPlots: async () =>
      fiefs.map(({ coordinates: { kingdom, province, plot } }) => ({ kingdom, province, plot })),
    holdsFief: async (playerId) => fiefs.some((fief) => fief.playerId === playerId),
    save: async (fief) => {
      fiefs.push(fief)
      return ok(undefined)
    },
  }
}

const raceLostFiefRepository = (): InMemoryFiefRepository => ({
  savedFiefs: () => [],
  occupiedPlots: async () => [],
  holdsFief: async () => false,
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

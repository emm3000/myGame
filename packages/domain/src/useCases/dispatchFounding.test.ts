import { assert, describe, expect, it } from 'vitest'
import { campOf } from '../camp/campOf'
import { Fief, type StoredFief } from '../fief/Fief'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { type HeldPlot, inMemoryKingdomMap } from '../testing/inMemoryKingdomMap'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { daysAfterSeasonEpoch, seasonalCatalogOf, secondsAfter } from '../testing/seasonalCatalogOf'
import { sequentialIds } from '../testing/sequentialIds'
import { Instant } from '../time/Instant'
import { dispatchFounding } from './dispatchFounding'
import { recallMarch } from './recallMarch'
import { resolveUpgrade } from './resolveUpgrade'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const dispatchInstant = Instant.fromEpochMilliseconds(86_400_000 + 180_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 20,
  plotsPerProvince: 15,
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

const catalogWithCap = (fiefCap: number): BuildingCatalog => ({
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => ({ ...fiefSettings, fiefCap }),
})

const catalog = catalogWithCap(2)

const campPlot = (): number => {
  const plot = Array.from({ length: 15 }, (_, index) => index + 1).find(
    (candidate) => campOf({ kingdom: 1, province: 2, plot: candidate }, plainCamps) !== undefined,
  )
  assert(plot !== undefined)
  return plot
}

const lordPlot: HeldPlot = {
  fiefId: 'fief-1',
  playerId: 'lord',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 3, plot: 12 },
}

const secondLordPlot: HeldPlot = {
  fiefId: 'fief-2',
  playerId: 'lord',
  name: 'Peña Alta',
  address: { kingdom: 1, province: 1, plot: 4 },
}

const rivalPlot: HeldPlot = {
  fiefId: 'fief-9',
  playerId: 'rival',
  name: 'Torre Parda',
  address: { kingdom: 1, province: 2, plot: 9 },
}

const map = inMemoryKingdomMap([lordPlot, secondLordPlot, rivalPlot])

const reservedMap = inMemoryKingdomMap(
  [lordPlot, secondLordPlot, rivalPlot],
  [{ playerId: 'rival', address: { kingdom: 1, province: 2, plot: 7 } }],
)

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: lordPlot.address,
    stocks: { wood: 500, stone: 100, iron: 300, gold: 100, food: 500 },
    storedAt: storedInstant,
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
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const unscaled = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const foundingOn = (province: number, plot: number, name = 'Sotoverde del Páramo') => ({
  playerId: 'lord',
  fiefId: 'fief-1',
  province,
  plot,
  name,
})

const dependenciesOver = (fiefs: ReadonlyArray<Fief>, fiefCatalog = catalog) => ({
  fiefs: inMemoryFiefRepository(fiefs),
  map,
  catalog: fiefCatalog,
  chronicle: inMemoryChronicle(),
  clock: frozenClock(dispatchInstant),
})

describe('dispatchFounding', () => {
  it('sends one settler to found a fief on a free plot', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({
      kind: 'away',
      order: 'found',
      name: 'Sotoverde del Páramo',
      province: 2,
      plot: 7,
      units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
      stayHours: 0,
      departedAt: dispatchInstant,
      oneWaySeconds: 900,
      loot: noLoot,
      lootPercent: unscaled,
    })
  })

  it('walks the settler 900 seconds to province 2, plot 7', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toMatchObject({ oneWaySeconds: 900 })
  })

  it('refuses a founding without a settler at home', async () => {
    const dependencies = dependenciesOver([
      storedFief({ units: { infantry: 4, cavalry: 0, archer: 0, settler: 0 } }),
    ])

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(result).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'settler', count: 1, atHome: 0 }),
    )
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding at the fief cap', async () => {
    const dependencies = dependenciesOver([
      storedFief({}),
      storedFief({ id: 'fief-2', name: 'Peña Alta', address: secondLordPlot.address }),
    ])

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(result).toEqual(err({ kind: 'FiefCapReached', cap: 2 }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('counts a founding march in flight toward the cap', async () => {
    const dependencies = dependenciesOver(
      [
        storedFief({}),
        storedFief({
          id: 'fief-2',
          name: 'Peña Alta',
          address: secondLordPlot.address,
          march: {
            kind: 'away',
            order: 'found',
            name: 'Sotoverde del Páramo',
            province: 2,
            plot: 3,
            units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
            stayHours: 0,
            departedAt: storedInstant,
            oneWaySeconds: 900,
            loot: noLoot,
            lootPercent: unscaled,
          },
        }),
      ],
      catalogWithCap(3),
    )

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(result).toEqual(err({ kind: 'FiefCapReached', cap: 3 }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding on a plot with a camp', async () => {
    const plot = campPlot()
    const dependencies = dependenciesOver([storedFief({})])

    const result = await dispatchFounding(foundingOn(2, plot), dependencies)

    expect(result).toEqual(err({ kind: 'PlotHasCamp', province: 2, plot }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding with a blank name', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    const result = await dispatchFounding(foundingOn(2, 7, '   '), dependencies)

    expect(result).toEqual(err({ kind: 'BlankFiefName' }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('stores the name trimmed', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    await dispatchFounding(foundingOn(2, 7, '  Sotoverde del Páramo '), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toMatchObject({
      name: 'Sotoverde del Páramo',
    })
  })

  it('refuses a founding while the march slot is busy', async () => {
    const dependencies = dependenciesOver([storedFief({})])
    await dispatchFounding(foundingOn(2, 7), dependencies)

    const result = await dispatchFounding(foundingOn(2, 8), dependencies)

    expect(result).toEqual(err({ kind: 'MarchSlotBusy' }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toMatchObject({ plot: 7 })
  })

  it('answers a busy march slot before the fief cap', async () => {
    const dependencies = dependenciesOver([
      storedFief({}),
      storedFief({ id: 'fief-2', name: 'Peña Alta', address: secondLordPlot.address }),
    ])
    await dispatchFounding(foundingOn(2, 7), { ...dependencies, catalog: catalogWithCap(3) })

    const result = await dispatchFounding(foundingOn(2, 8), dependencies)

    expect(result).toEqual(err({ kind: 'MarchSlotBusy' }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toMatchObject({ plot: 7 })
  })

  it('answers the fief cap before a target out of bounds', async () => {
    const dependencies = dependenciesOver([
      storedFief({}),
      storedFief({ id: 'fief-2', name: 'Peña Alta', address: secondLordPlot.address }),
    ])

    const result = await dispatchFounding(foundingOn(5, 7), dependencies)

    expect(result).toEqual(err({ kind: 'FiefCapReached', cap: 2 }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding to the own plot', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    const result = await dispatchFounding(foundingOn(3, 12), dependencies)

    expect(result).toEqual(err({ kind: 'MarchToOwnPlot' }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding to a held plot', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    const result = await dispatchFounding(foundingOn(2, 9), dependencies)

    expect(result).toEqual(err({ kind: 'PlotHeld', province: 2, plot: 9 }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding on a reserved plot before the index does', async () => {
    const dependencies = { ...dependenciesOver([storedFief({})]), map: reservedMap }

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(result).toEqual(err({ kind: 'PlotReserved', province: 2, plot: 7 }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding beyond the last province', async () => {
    const dependencies = dependenciesOver([storedFief({})])

    const result = await dispatchFounding(foundingOn(5, 7), dependencies)

    expect(result).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 5, plot: 7 }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a founding from a fief of another lord', async () => {
    const dependencies = dependenciesOver([storedFief({ playerId: 'neighbour' })])

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(result).toEqual(err({ kind: 'FiefNotFound', fiefId: 'fief-1' }))
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })
})

describe('dispatchFounding across seasons', () => {
  it('walks the settler 675 seconds in an autumn of 75 %', async () => {
    const dependencies = {
      ...dependenciesOver([storedFief({})], seasonalCatalogOf(catalog)),
      clock: frozenClock(daysAfterSeasonEpoch(17)),
    }

    await dispatchFounding(foundingOn(2, 7), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toMatchObject({ oneWaySeconds: 675 })
  })
})

describe('recalling a founding', () => {
  const sentFounding = async () => {
    const dependencies = dependenciesOver([storedFief({})])
    await dispatchFounding(foundingOn(2, 7), dependencies)
    return dependencies
  }

  it('recalls a founding and keeps the settler', async () => {
    const dependencies = await sentFounding()
    const recalledAt = secondsAfter(dispatchInstant, 600)
    await recallMarch(
      { playerId: 'lord', fiefId: 'fief-1', departedAt: dispatchInstant },
      { ...dependencies, clock: frozenClock(recalledAt) },
    )

    const resolved = await resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        ...dependencies,
        camps: inMemoryCampRegistry([]),
        chronicle: inMemoryChronicle(),
        ids: sequentialIds(),
        clock: frozenClock(secondsAfter(dispatchInstant, 1_200)),
      },
    )

    assert(resolved.ok)
    expect(resolved.value.events).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
        loot: noLoot,
        recalled: true,
        occurredAt: secondsAfter(dispatchInstant, 1_200),
      },
    ])
    expect(
      resolved.value.fief.unitsAtHomeAt(secondsAfter(dispatchInstant, 1_200)).countOf('settler'),
    ).toBe(1)
  })

  it('refuses to recall a founding at its arrival', async () => {
    const dependencies = await sentFounding()

    const result = await recallMarch(
      { playerId: 'lord', fiefId: 'fief-1', departedAt: dispatchInstant },
      { ...dependencies, clock: frozenClock(secondsAfter(dispatchInstant, 900)) },
    )

    expect(result).toEqual(err({ kind: 'MarchAlreadyReturning' }))
  })
})

describe('founding at the arrival', () => {
  const arrival = secondsAfter(dispatchInstant, 900)

  const rivalOnTheTarget = storedFief({
    id: 'fief-9',
    playerId: 'rival',
    name: 'Torre Parda',
    address: { kingdom: 1, province: 2, plot: 7 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
  })

  const sentFoundingFrom = async (origin: Fief, others: ReadonlyArray<Fief> = []) => {
    const dependencies = dependenciesOver([origin, ...others])
    const sent = await dispatchFounding(foundingOn(2, 7), dependencies)
    assert(sent.ok)
    return dependencies
  }

  const resolveAt = (dependencies: ReturnType<typeof dependenciesOver>, now: Instant) =>
    resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        ...dependencies,
        camps: inMemoryCampRegistry([]),
        chronicle: inMemoryChronicle(),
        ids: sequentialIds('founded'),
        clock: frozenClock(now),
      },
    )

  const foundedFiefOf = (dependencies: ReturnType<typeof dependenciesOver>) =>
    dependencies.fiefs.storedFiefOf('founded-1')

  it('founds the fief at the arrival of the settler', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))

    const result = await resolveAt(dependencies, arrival)

    assert(result.ok)
    expect(result.value.hasChanged).toBe(true)
    expect(await dependencies.fiefs.fiefsOf('lord')).toEqual(['founded-1', 'fief-1'])
    const founded = foundedFiefOf(dependencies)
    expect({
      playerId: founded?.playerId,
      name: founded?.name.value,
      coordinates: founded?.coordinates,
    }).toEqual({
      playerId: 'lord',
      name: 'Sotoverde del Páramo',
      coordinates: { kingdom: 1, province: 2, plot: 7 },
    })
  })

  it('starts the new fief with the starting stocks and nothing built', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))

    await resolveAt(dependencies, arrival)

    const founded = foundedFiefOf(dependencies)
    assert(founded !== undefined)
    expect({
      stocks: founded.stocks,
      buildingLevels: founded.buildingLevels,
      artLevels: founded.artLevels,
      settlers: founded.units.countOf('settler'),
      slot: founded.slot,
      studySlot: founded.studySlot,
      recruitOrder: founded.recruitOrder,
      march: founded.march,
    }).toEqual({
      stocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
      buildingLevels: {
        sawmill: 0,
        quarry: 0,
        ironMine: 0,
        farm: 0,
        warehouse: 0,
        library: 0,
        barracks: 0,
      },
      artLevels: { smithing: 0, masonry: 0 },
      settlers: 0,
      slot: { kind: 'idle' },
      studySlot: { kind: 'idle' },
      recruitOrder: { kind: 'idle' },
      march: { kind: 'idle' },
    })
  })

  it('accrues the new fief from the arrival instant', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))

    await resolveAt(dependencies, secondsAfter(arrival, 3_600))

    const founded = foundedFiefOf(dependencies)
    assert(founded !== undefined)
    expect(founded.storedAt).toEqual(arrival)
    const accrued = founded.accruedTo(catalog, secondsAfter(arrival, 3_600))
    assert(accrued.ok)
    expect(accrued.value.stocks).toEqual({ wood: 510, stone: 520, iron: 205, gold: 52, food: 310 })
  })

  it('takes the settler out of the origin fief at the founding', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))

    const result = await resolveAt(dependencies, arrival)

    assert(result.ok)
    expect(result.value.fief.units.countOf('settler')).toBe(0)
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.units.countOf('settler')).toBe(0)
  })

  it('frees the march slot at the founding', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))

    const result = await resolveAt(dependencies, secondsAfter(arrival, 60))

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
  })

  it('founds nothing before the arrival', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))

    const result = await resolveAt(dependencies, secondsAfter(arrival, -1))

    assert(result.ok)
    expect(result.value.hasChanged).toBe(false)
    expect(await dependencies.fiefs.fiefsOf('lord')).toEqual(['fief-1'])
    expect(result.value.fief.march).toMatchObject({ kind: 'away', order: 'found' })
  })

  it('founds nothing on a recalled founding', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))
    await recallMarch(
      { playerId: 'lord', fiefId: 'fief-1', departedAt: dispatchInstant },
      { ...dependencies, clock: frozenClock(secondsAfter(dispatchInstant, 600)) },
    )

    const result = await resolveAt(dependencies, secondsAfter(dispatchInstant, 1_200))

    assert(result.ok)
    expect(await dependencies.fiefs.fiefsOf('lord')).toEqual(['fief-1'])
    expect(result.value.fief.units.countOf('settler')).toBe(1)
  })

  it('turns the settler home when the plot is held at the arrival', async () => {
    const dependencies = await sentFoundingFrom(storedFief({}))
    await dependencies.fiefs.save(rivalOnTheTarget)

    const atArrival = await resolveAt(dependencies, arrival)

    assert(atArrival.ok)
    expect(atArrival.value.hasChanged).toBe(true)
    expect(atArrival.value.fief.march).toMatchObject({ kind: 'away', recalledAt: arrival })
    expect(await dependencies.fiefs.fiefsOf('lord')).toEqual(['fief-1'])
    const home = await resolveAt(dependencies, secondsAfter(arrival, 900))
    assert(home.ok)
    expect(home.value.events).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
        loot: noLoot,
        recalled: true,
        occurredAt: secondsAfter(arrival, 900),
      },
    ])
    expect(home.value.fief.units.countOf('settler')).toBe(1)
    expect(home.value.fief.march).toEqual({ kind: 'idle' })
  })

  it('settles a running levy before the founding', async () => {
    const dependencies = await sentFoundingFrom(
      storedFief({
        recruitOrder: {
          kind: 'open',
          unit: 'infantry',
          count: 10,
          cost: { wood: 200, stone: 0, iron: 100, gold: 0, food: 300 },
          perUnitSeconds: 120,
          startedAt: dispatchInstant,
        },
      }),
    )

    const result = await resolveAt(dependencies, arrival)

    assert(result.ok)
    const { units, recruitOrder } = result.value.fief
    expect({
      infantry: units.countOf('infantry'),
      settlers: units.countOf('settler'),
      recruitOrder,
    }).toEqual({
      infantry: 7,
      settlers: 0,
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 3,
        cost: { wood: 60, stone: 0, iron: 30, gold: 0, food: 90 },
        perUnitSeconds: 120,
        startedAt: secondsAfter(dispatchInstant, 840),
      },
    })
  })
})

describe('the founding in the chronicle', () => {
  const arrival = secondsAfter(dispatchInstant, 900)

  const founding = {
    province: 2,
    plot: 7,
    name: 'Sotoverde del Páramo',
  }

  const sentFounding = async () => {
    const dependencies = dependenciesOver([storedFief({})])
    const sent = await dispatchFounding(foundingOn(2, 7), dependencies)
    assert(sent.ok)
    return dependencies
  }

  const resolveAt = (dependencies: ReturnType<typeof dependenciesOver>, now: Instant) =>
    resolveUpgrade(
      { playerId: 'lord', fiefId: 'fief-1' },
      {
        ...dependencies,
        camps: inMemoryCampRegistry([]),
        ids: sequentialIds('founded'),
        clock: frozenClock(now),
      },
    )

  it('records the founding march sent on the origin', async () => {
    const dependencies = await sentFounding()

    expect(dependencies.chronicle.recordedEventsOf('fief-1')).toEqual([
      { kind: 'foundingSent', ...founding, occurredAt: dispatchInstant },
    ])
  })

  it('records nothing for a refused founding', async () => {
    const dependencies = dependenciesOver([
      storedFief({ units: { infantry: 4, cavalry: 0, archer: 0, settler: 0 } }),
    ])

    const result = await dispatchFounding(foundingOn(2, 7), dependencies)

    assert(!result.ok)
    expect(dependencies.chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('records the fief founded on the origin at the arrival', async () => {
    const dependencies = dependenciesOver([
      storedFief({
        recruitOrder: {
          kind: 'open',
          unit: 'infantry',
          count: 2,
          cost: { wood: 40, stone: 0, iron: 20, gold: 0, food: 60 },
          perUnitSeconds: 600,
          startedAt: dispatchInstant,
        },
      }),
    ])
    const sent = await dispatchFounding(foundingOn(2, 7), dependencies)
    assert(sent.ok)

    const result = await resolveAt(dependencies, secondsAfter(arrival, 3_600))

    assert(result.ok)
    const fiefFounded = { kind: 'fiefFounded', ...founding, occurredAt: arrival }
    expect(result.value.events).toEqual([
      fiefFounded,
      {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 1,
        occurredAt: secondsAfter(dispatchInstant, 1_200),
      },
    ])
    expect(dependencies.chronicle.recordedEventsOf('fief-1')).toEqual([
      { kind: 'foundingSent', ...founding, occurredAt: dispatchInstant },
      ...result.value.events,
    ])
  })

  it('starts the new fief chronicle with its founding', async () => {
    const dependencies = await sentFounding()

    await resolveAt(dependencies, secondsAfter(arrival, 60))

    expect(dependencies.chronicle.recordedEventsOf('founded-1')).toEqual([
      { kind: 'fiefFounded', ...founding, occurredAt: arrival },
    ])
  })

  it('records no founding for a founding that turns home', async () => {
    const dependencies = await sentFounding()
    await dependencies.fiefs.save(
      storedFief({
        id: 'fief-9',
        playerId: 'rival',
        name: 'Torre Parda',
        address: { kingdom: 1, province: 2, plot: 7 },
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
      }),
    )

    await resolveAt(dependencies, arrival)
    await resolveAt(dependencies, secondsAfter(arrival, 900))

    expect(dependencies.chronicle.recordedEventsOf('fief-1')).toEqual([
      { kind: 'foundingSent', ...founding, occurredAt: dispatchInstant },
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
        loot: noLoot,
        recalled: true,
        occurredAt: secondsAfter(arrival, 900),
      },
    ])
    expect(dependencies.chronicle.recordedEventsOf('fief-9')).toEqual([])
  })
})

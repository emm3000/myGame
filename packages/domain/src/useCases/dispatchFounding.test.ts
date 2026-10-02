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

const map = inMemoryKingdomMap([lordPlot, secondLordPlot])

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
    units: { infantry: 0, cavalry: 0, settler: 1 },
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
      units: { infantry: 0, cavalry: 0, settler: 1 },
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
      storedFief({ units: { infantry: 4, cavalry: 0, settler: 0 } }),
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
            units: { infantry: 0, cavalry: 0, settler: 1 },
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

    const result = await dispatchFounding(foundingOn(1, 4), dependencies)

    expect(result).toEqual(err({ kind: 'PlotHeld', province: 1, plot: 4 }))
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
        clock: frozenClock(secondsAfter(dispatchInstant, 1_200)),
      },
    )

    assert(resolved.ok)
    expect(resolved.value.events).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 0, cavalry: 0, settler: 1 },
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

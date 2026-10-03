import { assert, describe, expect, it } from 'vitest'
import type { Fief as FiefEntity, Stocks, StoredFief } from '../fief/Fief'
import { Fief } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import {
  type InMemoryFiefRepository,
  inMemoryFiefRepository,
} from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { daysAfterSeasonEpoch, seasonalCatalogOf, secondsAfter } from '../testing/seasonalCatalogOf'
import { sequentialIds } from '../testing/sequentialIds'
import { Instant } from '../time/Instant'
import { dispatchTransport } from './dispatchTransport'
import { resolveUpgrade } from './resolveUpgrade'

const dispatchInstant = Instant.fromEpochMilliseconds(86_400_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const still = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 20,
  plotsPerProvince: 15,
  baseRates: still,
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 0 },
    uplands: { resource: 'stone', ratePerHour: 0 },
    ridges: { resource: 'iron', ratePerHour: 0 },
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

const storedFief = (
  stored: Partial<StoredFief> & Pick<StoredFief, 'id' | 'address'>,
): FiefEntity => {
  const restored = Fief.restore({
    playerId: 'lord',
    name: 'Vado Viejo',
    stocks: { wood: 500, stone: 300, iron: 300, gold: 100, food: 500 },
    storedAt: dispatchInstant,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 3,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 12, cavalry: 6, settler: 1 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    ...stored,
  })
  assert(restored.ok)
  return restored.value
}

const sendingFief = (overrides: Partial<StoredFief> = {}): FiefEntity =>
  storedFief({ id: 'fief-1', address: { kingdom: 1, province: 3, plot: 12 }, ...overrides })

const otherFief = (overrides: Partial<StoredFief> = {}): FiefEntity =>
  storedFief({
    id: 'fief-2',
    name: 'Peña Alta',
    address: { kingdom: 1, province: 2, plot: 7 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    ...overrides,
  })

const rivalFief = (): FiefEntity =>
  storedFief({
    id: 'fief-9',
    playerId: 'rival',
    name: 'Torre Parda',
    address: { kingdom: 1, province: 2, plot: 9 },
  })

const sixRiders: UnitCountsByKind = { infantry: 0, cavalry: 6, settler: 0 }

const fullCargo: Stocks = { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 }

const transportOf = (
  overrides: Partial<{ toFiefId: string; units: UnitCountsByKind; cargo: Stocks }> = {},
) => ({
  playerId: 'lord',
  fiefId: 'fief-1',
  toFiefId: 'fief-2',
  units: sixRiders,
  cargo: fullCargo,
  ...overrides,
})

const dependenciesOver = (
  fiefs: ReadonlyArray<FiefEntity>,
  instant: Instant = dispatchInstant,
  fiefCatalog: BuildingCatalog = catalog,
) => ({
  fiefs: inMemoryFiefRepository(fiefs),
  catalog: fiefCatalog,
  clock: frozenClock(instant),
})

const resolveAt = (fiefs: InMemoryFiefRepository, fiefId: string, instant: Instant) =>
  resolveUpgrade(
    { playerId: 'lord', fiefId },
    {
      fiefs,
      chronicle: inMemoryChronicle(),
      camps: inMemoryCampRegistry([]),
      catalog,
      clock: frozenClock(instant),
      ids: sequentialIds(),
    },
  )

const lordsFiefs = (): ReadonlyArray<FiefEntity> => [sendingFief(), otherFief(), rivalFief()]

describe('dispatchTransport', () => {
  it('debits the cargo from the origin at dispatch', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(transportOf(), dependencies)

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('fief-1')?.stocks).toEqual({
      wood: 200,
      stone: 100,
      iron: 80,
      gold: 100,
      food: 500,
    })
  })

  it('rides six riders 450 seconds to the other fief', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    await dispatchTransport(transportOf(), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({
      kind: 'away',
      order: 'transport',
      toFiefId: 'fief-2',
      cargo: fullCargo,
      province: 2,
      plot: 7,
      units: sixRiders,
      stayHours: 0,
      departedAt: dispatchInstant,
      oneWaySeconds: 450,
      loot: still,
      lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    })
  })

  it('stores the cargo on the other fief, arriving with the riders', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    await dispatchTransport(transportOf(), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-2')?.incomingCargo).toEqual({
      fromFiefId: 'fief-1',
      name: 'Vado Viejo',
      province: 3,
      plot: 12,
      cargo: fullCargo,
      arrivesAt: secondsAfter(dispatchInstant, 450),
    })
  })

  it('rides 338 seconds in an autumn of 75 %', async () => {
    const autumn = daysAfterSeasonEpoch(17)
    const dependencies = dependenciesOver(
      [sendingFief({ storedAt: autumn }), otherFief({ storedAt: autumn })],
      autumn,
      seasonalCatalogOf(catalog),
    )

    await dispatchTransport(transportOf(), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toMatchObject({ oneWaySeconds: 338 })
  })

  it('refuses a cargo above the carry of the party', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(
      transportOf({ cargo: { ...fullCargo, iron: 221 } }),
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'CargoAboveCarry', cargo: 721, carry: 720 }))
  })

  it('refuses an empty cargo', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(transportOf({ cargo: still }), dependencies)

    expect(result).toEqual(err({ kind: 'EmptyCargo' }))
  })

  it('refuses a cargo above the stocks', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(
      transportOf({ cargo: { ...still, wood: 600 } }),
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'InsufficientResources', missing: { ...still, wood: 100 } }))
  })

  it('refuses a settler on a transport', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(
      transportOf({ units: { ...sixRiders, settler: 1 } }),
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'UnitUnfitForOrder', unit: 'settler', order: 'transport' }))
  })

  it('refuses a transport to the fief it leaves', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(transportOf({ toFiefId: 'fief-1' }), dependencies)

    expect(result).toEqual(err({ kind: 'MarchToOwnPlot' }))
  })

  it('refuses a transport to the fief of another lord', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(transportOf({ toFiefId: 'fief-9' }), dependencies)

    expect(result).toEqual(err({ kind: 'FiefNotFound', fiefId: 'fief-9' }))
  })

  it('refuses a negative amount of the cargo', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(
      transportOf({ cargo: { ...fullCargo, gold: -1 } }),
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'NegativeResourceAmount', amount: -1 }))
  })

  it('refuses a transport while the march slot is busy', async () => {
    const dependencies = dependenciesOver(lordsFiefs())
    await dispatchTransport(
      transportOf({ units: { ...sixRiders, cavalry: 1 }, cargo: { ...still, wood: 1 } }),
      dependencies,
    )

    const result = await dispatchTransport(transportOf(), dependencies)

    expect(result).toEqual(err({ kind: 'MarchSlotBusy' }))
  })

  it('refuses more riders than wait at home', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    const result = await dispatchTransport(
      transportOf({ units: { ...sixRiders, cavalry: 7 } }),
      dependencies,
    )

    expect(result).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'cavalry', count: 7, atHome: 6 }),
    )
  })

  it('writes nothing when it refuses', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    await dispatchTransport(transportOf({ cargo: { ...fullCargo, iron: 221 } }), dependencies)

    expect(dependencies.fiefs.storedFiefOf('fief-1')?.march).toEqual({ kind: 'idle' })
    expect(dependencies.fiefs.storedFiefOf('fief-2')?.incomingCargo).toBeUndefined()
  })
})

describe('the arrival of a transport', () => {
  const sentTransport = async (other: FiefEntity = otherFief()) => {
    const dependencies = dependenciesOver([sendingFief(), other, rivalFief()])
    const sent = await dispatchTransport(transportOf(), dependencies)
    assert(sent.ok)
    return dependencies.fiefs
  }

  it('credits the cargo to the other fief at the arrival', async () => {
    const fiefs = await sentTransport()

    const resolved = await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 450))

    assert(resolved.ok)
    expect(resolved.value.fief.stocks).toEqual({
      wood: 400,
      stone: 300,
      iron: 320,
      gold: 100,
      food: 100,
    })
  })

  it('clears the incoming cargo once credited', async () => {
    const fiefs = await sentTransport()

    await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 450))

    expect(fiefs.storedFiefOf('fief-2')?.incomingCargo).toBeUndefined()
  })

  it('credits the cargo above the capacity', async () => {
    const fiefs = await sentTransport(
      otherFief({ stocks: { wood: 1000, stone: 1000, iron: 1000, gold: 1000, food: 1000 } }),
    )

    const resolved = await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 600))

    assert(resolved.ok)
    expect(resolved.value.fief.stocks).toEqual({
      wood: 1300,
      stone: 1200,
      iron: 1220,
      gold: 1000,
      food: 1000,
    })
  })

  it('credits nothing before the arrival', async () => {
    const fiefs = await sentTransport()

    const resolved = await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 449))

    assert(resolved.ok)
    expect(resolved.value.fief.stocks).toEqual({
      wood: 100,
      stone: 100,
      iron: 100,
      gold: 100,
      food: 100,
    })
  })

  it('returns the party empty', async () => {
    const fiefs = await sentTransport()

    const resolved = await resolveAt(fiefs, 'fief-1', secondsAfter(dispatchInstant, 900))

    assert(resolved.ok)
    expect(resolved.value.fief.march).toEqual({ kind: 'idle' })
    expect(resolved.value.fief.stocks).toEqual({
      wood: 200,
      stone: 100,
      iron: 80,
      gold: 100,
      food: 500,
    })
  })
})

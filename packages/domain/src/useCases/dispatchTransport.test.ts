import { assert, describe, expect, it } from 'vitest'
import type { Fief as FiefEntity, Stocks, StoredFief } from '../fief/Fief'
import { Fief } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { type InMemoryChronicle, inMemoryChronicle } from '../testing/inMemoryChronicle'
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
import { recallMarch } from './recallMarch'
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
    units: { infantry: 12, cavalry: 6, archer: 0, settler: 1 },
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

const sixRiders: UnitCountsByKind = { infantry: 0, cavalry: 6, archer: 0, settler: 0 }

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
  chronicle: inMemoryChronicle(),
  catalog: fiefCatalog,
  clock: frozenClock(instant),
})

const resolveAt = (
  fiefs: InMemoryFiefRepository,
  fiefId: string,
  instant: Instant,
  chronicle: InMemoryChronicle = inMemoryChronicle(),
) =>
  resolveUpgrade(
    { playerId: 'lord', fiefId },
    {
      fiefs,
      chronicle,
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

  it('reads no fief of another lord', async () => {
    const dependencies = dependenciesOver(lordsFiefs())
    const read: Array<string> = []
    const fiefs = {
      ...dependencies.fiefs,
      fiefOf: (fiefId: string) => {
        read.push(fiefId)
        return dependencies.fiefs.fiefOf(fiefId)
      },
    }

    await dispatchTransport(transportOf({ toFiefId: 'fief-9' }), { ...dependencies, fiefs })

    expect(read).not.toContain('fief-9')
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

  it('records the transport sent on the origin', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    await dispatchTransport(transportOf(), dependencies)

    expect(dependencies.chronicle.recordedEventsOf('fief-1')).toEqual([
      {
        kind: 'transportSent',
        province: 2,
        plot: 7,
        name: 'Peña Alta',
        cargo: fullCargo,
        occurredAt: dispatchInstant,
      },
    ])
  })

  it('records nothing for a refused transport', async () => {
    const dependencies = dependenciesOver(lordsFiefs())

    await dispatchTransport(transportOf({ cargo: { ...fullCargo, iron: 221 } }), dependencies)

    expect(dependencies.chronicle.recordedEventsOf('fief-1')).toEqual([])
    expect(dependencies.chronicle.recordedEventsOf('fief-2')).toEqual([])
  })
})

const sentTransport = async (
  other: FiefEntity = otherFief(),
  sending: FiefEntity = sendingFief(),
): Promise<InMemoryFiefRepository> => {
  const dependencies = dependenciesOver([sending, other, rivalFief()])
  const sent = await dispatchTransport(transportOf(), dependencies)
  assert(sent.ok)
  return dependencies.fiefs
}

describe('the arrival of a transport', () => {
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

  it('records the cargo arrived on the other fief at the arrival', async () => {
    const fiefs = await sentTransport()
    const chronicle = inMemoryChronicle()

    await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 600), chronicle)

    expect(chronicle.recordedEventsOf('fief-2')).toEqual([
      {
        kind: 'transportArrived',
        province: 3,
        plot: 12,
        name: 'Vado Viejo',
        cargo: fullCargo,
        occurredAt: secondsAfter(dispatchInstant, 450),
      },
    ])
  })

  it('credits the cargo after every other finish of its instant', async () => {
    const fiefs = await sentTransport(
      otherFief({
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
        recruitOrder: {
          kind: 'open',
          unit: 'infantry',
          count: 1,
          cost: still,
          perUnitSeconds: 450,
          startedAt: dispatchInstant,
        },
      }),
    )
    const chronicle = inMemoryChronicle()

    await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 450), chronicle)

    expect(chronicle.recordedEventsOf('fief-2').map((event) => event.kind)).toEqual([
      'recruitsDelivered',
      'transportArrived',
    ])
  })

  it('records the return of a transport with no loot', async () => {
    const fiefs = await sentTransport()
    const chronicle = inMemoryChronicle()

    await resolveAt(fiefs, 'fief-1', secondsAfter(dispatchInstant, 900), chronicle)

    expect(chronicle.recordedEventsOf('fief-1')).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: sixRiders,
        loot: still,
        recalled: false,
        occurredAt: secondsAfter(dispatchInstant, 900),
      },
    ])
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

describe('the recall of a transport', () => {
  const recallAt = (fiefs: InMemoryFiefRepository, instant: Instant) =>
    recallMarch(
      { playerId: 'lord', fiefId: 'fief-1', departedAt: dispatchInstant },
      { fiefs, catalog, clock: frozenClock(instant) },
    )

  it('recalls a transport and drops the cargo of the other fief', async () => {
    const fiefs = await sentTransport()

    const recalled = await recallAt(fiefs, secondsAfter(dispatchInstant, 300))

    assert(recalled.ok)
    expect(fiefs.storedFiefOf('fief-2')?.incomingCargo).toBeUndefined()
  })
  it('carries the cargo home at the return of a recall', async () => {
    const fiefs = await sentTransport()
    await recallAt(fiefs, secondsAfter(dispatchInstant, 300))

    const resolved = await resolveAt(fiefs, 'fief-1', secondsAfter(dispatchInstant, 600))

    assert(resolved.ok)
    expect(resolved.value.fief.march).toEqual({ kind: 'idle' })
    expect(resolved.value.fief.stocks).toEqual({
      wood: 500,
      stone: 300,
      iron: 300,
      gold: 100,
      food: 500,
    })
  })
  it('credits the returned cargo above the capacity', async () => {
    const fiefs = await sentTransport(
      otherFief(),
      sendingFief({ stocks: { wood: 1200, stone: 1200, iron: 1200, gold: 1200, food: 1200 } }),
    )
    await recallAt(fiefs, secondsAfter(dispatchInstant, 300))

    const resolved = await resolveAt(fiefs, 'fief-1', secondsAfter(dispatchInstant, 600))

    assert(resolved.ok)
    expect(resolved.value.fief.stocks).toEqual({
      wood: 1200,
      stone: 1200,
      iron: 1200,
      gold: 1200,
      food: 1200,
    })
  })

  it('records no arrival for a recalled transport', async () => {
    const fiefs = await sentTransport()
    await recallAt(fiefs, secondsAfter(dispatchInstant, 300))
    const chronicle = inMemoryChronicle()

    await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 600), chronicle)

    expect(chronicle.recordedEventsOf('fief-2')).toEqual([])
  })

  it('records a recalled transport returned with its cargo', async () => {
    const fiefs = await sentTransport()
    await recallAt(fiefs, secondsAfter(dispatchInstant, 300))
    const chronicle = inMemoryChronicle()

    await resolveAt(fiefs, 'fief-1', secondsAfter(dispatchInstant, 600), chronicle)

    expect(chronicle.recordedEventsOf('fief-1')).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: sixRiders,
        loot: fullCargo,
        recalled: true,
        occurredAt: secondsAfter(dispatchInstant, 600),
      },
    ])
  })

  it('refuses the recall of a transport at its arrival', async () => {
    const fiefs = await sentTransport()

    const result = await recallAt(fiefs, secondsAfter(dispatchInstant, 450))

    expect(result).toEqual(err({ kind: 'MarchAlreadyReturning' }))
  })

  it('writes nothing on a refused recall', async () => {
    const fiefs = await sentTransport()

    await recallAt(fiefs, secondsAfter(dispatchInstant, 450))

    expect(fiefs.storedFiefOf('fief-1')?.march).toMatchObject({ loot: still })
    expect(fiefs.storedFiefOf('fief-1')?.march).not.toHaveProperty('recalledAt')
    expect(fiefs.storedFiefOf('fief-2')?.incomingCargo).toMatchObject({ cargo: fullCargo })
  })

  it('writes nothing when the other fief is missing', async () => {
    const sent = (await sentTransport()).storedFiefOf('fief-1')
    assert(sent !== undefined)
    const fiefs = inMemoryFiefRepository([sent])

    const result = await recallAt(fiefs, secondsAfter(dispatchInstant, 300))

    expect(result).toEqual(err({ kind: 'FiefNotFound', fiefId: 'fief-2' }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(sent)
  })

  it('keeps one incoming cargo per fief', async () => {
    const fiefs = await sentTransport()
    await recallAt(fiefs, secondsAfter(dispatchInstant, 100))
    expect(fiefs.storedFiefOf('fief-2')?.incomingCargo).toBeUndefined()
    await resolveAt(fiefs, 'fief-1', secondsAfter(dispatchInstant, 200))
    const resent = await dispatchTransport(transportOf({ cargo: { ...still, wood: 100 } }), {
      fiefs,
      chronicle: inMemoryChronicle(),
      catalog,
      clock: frozenClock(secondsAfter(dispatchInstant, 200)),
    })
    assert(resent.ok)

    const arrived = await resolveAt(fiefs, 'fief-2', secondsAfter(dispatchInstant, 650))

    assert(arrived.ok)
    expect(arrived.value.fief.stocks).toMatchObject({ wood: 200, stone: 100, iron: 100 })
    expect(fiefs.storedFiefOf('fief-1')?.stocks).toMatchObject({ wood: 400, stone: 300, iron: 300 })
  })
})

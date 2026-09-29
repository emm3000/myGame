import { assert, describe, expect, it } from 'vitest'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type StoredFief } from '../fief/Fief'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { type HeldPlot, inMemoryKingdomMap } from '../testing/inMemoryKingdomMap'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { dispatchMarch } from './dispatchMarch'

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
  units: plainUnits,
  forage: plainForage,
  seasons: neutralSeasons,
}

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const lordPlot: HeldPlot = {
  playerId: 'lord',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 1, plot: 1 },
}

const neighbourPlot: HeldPlot = {
  playerId: 'neighbour',
  name: 'Peña Alta',
  address: { kingdom: 1, province: 2, plot: 9 },
}

const map = inMemoryKingdomMap([lordPlot, neighbourPlot])

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
      barracks: 0,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 10 },
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

const tenInfantryForTwoHours = {
  playerId: 'lord',
  province: 2,
  plot: 5,
  infantry: 10,
  stayHours: 2,
}

const dependenciesOver = (fief: Fief) => {
  const fiefs = inMemoryFiefRepository([fief])
  return { fiefs, map, catalog, clock: frozenClock(dispatchInstant) }
}

describe('dispatchMarch', () => {
  it('sends the infantry at home to a free plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch(tenInfantryForTwoHours, dependencies)

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      kind: 'away',
      province: 2,
      plot: 5,
      infantry: 10,
      stayHours: 2,
      departedAt: dispatchInstant,
    })
  })

  it('fixes the road time from the fief to the plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({ oneWaySeconds: 840 })
  })

  it('fixes the loot at dispatch from the plot terrain', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
    })
  })

  it('keeps the peasants of the infantry away', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesOver(fief)

    await dispatchMarch(tenInfantryForTwoHours, dependencies)

    const away = dependencies.fiefs.storedFiefOf('lord')
    assert(away !== undefined)
    const peasantsOf = (held: Fief) =>
      derivePeasantCounts(held.buildingLevels, held.units, held.recruitOrder, catalog)
    expect(peasantsOf(away)).toEqual(peasantsOf(fief))
    expect(away.stocks).toEqual(fief.stocks)
    expect(away.storedAt).toBe(fief.storedAt)
  })

  it('counts the units an open order has delivered as at home', async () => {
    const recruiting = storedFief({
      units: { infantry: 0 },
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 5,
        cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
        perUnitSeconds: 60,
        startedAt: storedInstant,
      },
    })

    const tooMany = await dispatchMarch(
      { ...tenInfantryForTwoHours, infantry: 4 },
      dependenciesOver(recruiting),
    )
    const delivered = await dispatchMarch(
      { ...tenInfantryForTwoHours, infantry: 3 },
      dependenciesOver(recruiting),
    )

    expect(tooMany).toEqual(err({ kind: 'NotEnoughInfantryAtHome', infantry: 4, atHome: 3 }))
    assert(delivered.ok)
  })

  it('refuses a march while another is away', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    await dispatchMarch({ ...tenInfantryForTwoHours, infantry: 4 }, dependencies)

    const result = await dispatchMarch({ ...tenInfantryForTwoHours, infantry: 4 }, dependencies)

    expect(result).toEqual(err({ kind: 'MarchSlotBusy' }))
  })

  it('refuses a march to a plot holding a fief', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 9 }, dependencies)

    expect(result).toEqual(err({ kind: 'PlotHeld', province: 2, plot: 9 }))
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a march to the fief own plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch(
      { ...tenInfantryForTwoHours, province: 1, plot: 1 },
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'MarchToOwnPlot' }))
  })

  it('refuses more infantry than are at home', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchMarch({ ...tenInfantryForTwoHours, infantry: 11 }, dependencies)

    expect(result).toEqual(err({ kind: 'NotEnoughInfantryAtHome', infantry: 11, atHome: 10 }))
  })

  it('refuses a count of infantry below one or fractional', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const none = await dispatchMarch({ ...tenInfantryForTwoHours, infantry: 0 }, dependencies)
    const fractional = await dispatchMarch(
      { ...tenInfantryForTwoHours, infantry: 1.5 },
      dependencies,
    )

    expect(none).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
    expect(fractional).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 1.5 }))
  })

  it('refuses a stay of zero hours or of nine', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const stays = await Promise.all(
      [0, 9, 1.5].map((stayHours) =>
        dispatchMarch({ ...tenInfantryForTwoHours, stayHours }, dependencies),
      ),
    )
    const longest = await dispatchMarch({ ...tenInfantryForTwoHours, stayHours: 8 }, dependencies)

    expect(stays).toEqual([
      err({ kind: 'StayOutOfRange', stayHours: 0 }),
      err({ kind: 'StayOutOfRange', stayHours: 9 }),
      err({ kind: 'StayOutOfRange', stayHours: 1.5 }),
    ])
    assert(longest.ok)
  })

  it('refuses a province past the last held one plus one', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const past = await dispatchMarch({ ...tenInfantryForTwoHours, province: 4 }, dependencies)
    const none = await dispatchMarch({ ...tenInfantryForTwoHours, province: 0 }, dependencies)
    const lastPlusOne = await dispatchMarch(
      { ...tenInfantryForTwoHours, province: 3 },
      dependencies,
    )

    expect(past).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 4, plot: 5 }))
    expect(none).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 0, plot: 5 }))
    assert(lastPlusOne.ok)
  })

  it('refuses a plot past the plots of a province', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const past = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 16 }, dependencies)
    const none = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 0 }, dependencies)
    const last = await dispatchMarch({ ...tenInfantryForTwoHours, plot: 15 }, dependencies)

    expect(past).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 2, plot: 16 }))
    expect(none).toEqual(err({ kind: 'MarchTargetOutOfBounds', province: 2, plot: 0 }))
    assert(last.ok)
  })

  it('refuses in order: count, stay, slot, bounds, own plot, held plot, infantry at home', async () => {
    const away = dependenciesOver(storedFief({}))
    await dispatchMarch({ ...tenInfantryForTwoHours, infantry: 4 }, away)
    const idle = dependenciesOver(storedFief({}))

    const refusals = await Promise.all([
      dispatchMarch({ ...tenInfantryForTwoHours, infantry: 0, stayHours: 0 }, away),
      dispatchMarch({ ...tenInfantryForTwoHours, stayHours: 0, province: 9 }, away),
      dispatchMarch({ ...tenInfantryForTwoHours, province: 9 }, away),
      dispatchMarch({ ...tenInfantryForTwoHours, infantry: 11, province: 1, plot: 16 }, idle),
      dispatchMarch({ ...tenInfantryForTwoHours, infantry: 11, province: 1, plot: 1 }, idle),
      dispatchMarch({ ...tenInfantryForTwoHours, infantry: 11, plot: 9 }, idle),
    ])

    expect(refusals.map((refusal) => (refusal.ok ? 'sent' : refusal.error.kind))).toEqual([
      'InvalidUnitCount',
      'StayOutOfRange',
      'MarchSlotBusy',
      'MarchTargetOutOfBounds',
      'MarchToOwnPlot',
      'PlotHeld',
    ])
  })

  it('marches while the build, study and recruit slots are busy', async () => {
    const busy = storedFief({
      buildingLevels: {
        sawmill: 0,
        quarry: 0,
        ironMine: 0,
        farm: 0,
        warehouse: 0,
        library: 1,
        barracks: 1,
      },
      slot: {
        kind: 'busy',
        building: 'sawmill',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 3_600_000),
        cost: { wood: 40, stone: 10, iron: 0, gold: 0, food: 0 },
      },
      buildQueue: [
        {
          building: 'farm',
          targetLevel: 1,
          cost: { wood: 40, stone: 10, iron: 0, gold: 0, food: 0 },
          durationSeconds: 120,
        },
      ],
      studySlot: {
        kind: 'busy',
        art: 'smithing',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 3_600_000),
        cost: { wood: 30, stone: 0, iron: 60, gold: 25, food: 0 },
      },
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 5,
        cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
        perUnitSeconds: 3_600,
        startedAt: storedInstant,
      },
    })
    const dependencies = dependenciesOver(busy)

    const result = await dispatchMarch(tenInfantryForTwoHours, dependencies)

    assert(result.ok)
    const away = dependencies.fiefs.storedFiefOf('lord')
    expect(away?.march.kind).toBe('away')
    expect([away?.slot, away?.buildQueue, away?.studySlot, away?.recruitOrder]).toEqual([
      busy.slot,
      busy.buildQueue,
      busy.studySlot,
      busy.recruitOrder,
    ])
  })
})

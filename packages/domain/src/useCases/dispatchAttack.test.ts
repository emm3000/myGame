import { assert, describe, expect, it } from 'vitest'
import type { CampBattle } from '../camp/CampBattle'
import type { CampTier } from '../camp/CampTier'
import { campOf } from '../camp/campOf'
import { Fief, type StoredFief } from '../fief/Fief'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { type HeldPlot, inMemoryKingdomMap } from '../testing/inMemoryKingdomMap'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { dispatchAttack } from './dispatchAttack'
import { dispatchMarch } from './dispatchMarch'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const dispatchInstant = Instant.fromEpochMilliseconds(86_400_000 + 180_000)

const hoursBeforeDispatch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(dispatchInstant.epochMilliseconds - hours * 3_600_000)

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
  camps: plainCamps,
  seasons: neutralSeasons,
}

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const plotsOfProvinceTwo = Array.from({ length: 15 }, (_, index) => index + 1)

const campPlotOfTier = (tier: CampTier): number => {
  const plot = plotsOfProvinceTwo.find(
    (candidate) => campOf({ kingdom: 1, province: 2, plot: candidate }, plainCamps)?.tier === tier,
  )
  assert(plot !== undefined)
  return plot
}

const freePlot = (): number => {
  const plot = plotsOfProvinceTwo.find(
    (candidate) =>
      candidate !== 9 &&
      campOf({ kingdom: 1, province: 2, plot: candidate }, plainCamps) === undefined,
  )
  assert(plot !== undefined)
  return plot
}

const tierOnePlot = campPlotOfTier(1)

const tierTwoPlot = campPlotOfTier(2)

const heldCampPlot = campPlotOfTier(3)

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

const settlerPlot: HeldPlot = {
  playerId: 'settler',
  name: 'Roca Nueva',
  address: { kingdom: 1, province: 2, plot: heldCampPlot },
}

const map = inMemoryKingdomMap([lordPlot, neighbourPlot, settlerPlot])

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
    units: { infantry: 10, cavalry: 0 },
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

const tenInfantryOn = (plot: number) => ({
  playerId: 'lord',
  province: 2,
  plot,
  units: { infantry: 10, cavalry: 0 },
})

const dependenciesOver = (fief: Fief, battles: ReadonlyArray<CampBattle> = []) => {
  const fiefs = inMemoryFiefRepository([fief])
  const camps = inMemoryCampRegistry(battles)
  return { fiefs, map, camps, catalog, clock: frozenClock(dispatchInstant) }
}

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

describe('dispatchAttack', () => {
  it('sends an attack with the camp strength fixed at dispatch', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      kind: 'away',
      order: 'attack',
      province: 2,
      plot: tierOnePlot,
      units: { infantry: 10, cavalry: 0 },
      stayHours: 0,
      departedAt: dispatchInstant,
      camp: { tier: 1, strength: 6 },
      fought: false,
    })
  })

  it('fixes the road time from the fief to the camp', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      oneWaySeconds: 600 + (tierOnePlot - 1) * 60,
    })
  })

  it('reads a camp never fought at its max', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchAttack(tenInfantryOn(tierTwoPlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      camp: { tier: 2, strength: 15 },
    })
  })

  it('reads a beaten camp regrown by the dispatch', async () => {
    const dependencies = dependenciesOver(storedFief({}), [
      { kingdom: 1, province: 2, plot: tierOnePlot, strength: 0, foughtAt: hoursBeforeDispatch(3) },
    ])

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      camp: { tier: 1, strength: 3 },
    })
  })

  it('fixes the loot of a predicted win', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
    })
  })

  it('stores a whole loot percent of 100 per resource', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    })
  })

  it('fixes no loot for a predicted loss', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    await dispatchAttack(tenInfantryOn(tierTwoPlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({ loot: noLoot })
  })

  it('attacks a camp beaten to nothing for nothing', async () => {
    const dependencies = dependenciesOver(storedFief({}), [
      { kingdom: 1, province: 2, plot: tierOnePlot, strength: 0, foughtAt: dispatchInstant },
    ])

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      camp: { tier: 1, strength: 0 },
      loot: noLoot,
    })
  })

  it('debits nothing and keeps the stored instant', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesOver(fief)

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    const away = dependencies.fiefs.storedFiefOf('lord')
    expect(away?.stocks).toEqual(fief.stocks)
    expect(away?.storedAt).toBe(fief.storedAt)
  })

  it('keeps the unit counts at dispatch', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesOver(fief)

    await dispatchAttack(tenInfantryOn(tierOnePlot), dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')?.units).toEqual(fief.units)
  })

  it('refuses a player who holds no fief', async () => {
    const result = await dispatchAttack(
      { ...tenInfantryOn(tierOnePlot), playerId: 'landless' },
      dependenciesOver(storedFief({})),
    )

    expect(result).toEqual(err({ kind: 'FiefNotFound', playerId: 'landless' }))
  })

  it('refuses an attack on a plot without a camp', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    const plot = freePlot()

    const result = await dispatchAttack(tenInfantryOn(plot), dependencies)

    expect(result).toEqual(err({ kind: 'PlotHasNoCamp', province: 2, plot }))
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses an attack on a held plot', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchAttack(tenInfantryOn(heldCampPlot), dependencies)

    expect(result).toEqual(err({ kind: 'PlotHeld', province: 2, plot: heldCampPlot }))
  })

  it('refuses an attack while a march is away', async () => {
    const dependencies = dependenciesOver(storedFief({}))
    await dispatchMarch(
      {
        playerId: 'lord',
        province: 2,
        plot: freePlot(),
        units: { infantry: 4, cavalry: 0 },
        stayHours: 2,
      },
      dependencies,
    )

    const result = await dispatchAttack(
      { ...tenInfantryOn(tierOnePlot), units: { infantry: 4, cavalry: 0 } },
      dependencies,
    )

    expect(result).toEqual(err({ kind: 'MarchSlotBusy' }))
  })

  it('refuses more infantry than are at home', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const result = await dispatchAttack(
      { ...tenInfantryOn(tierOnePlot), units: { infantry: 11, cavalry: 0 } },
      dependencies,
    )

    expect(result).toEqual(
      err({ kind: 'NotEnoughUnitsAtHome', unit: 'infantry', count: 11, atHome: 10 }),
    )
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toEqual({ kind: 'idle' })
  })

  it('refuses a count of infantry below one or fractional', async () => {
    const dependencies = dependenciesOver(storedFief({}))

    const none = await dispatchAttack(
      { ...tenInfantryOn(tierOnePlot), units: { infantry: 0, cavalry: 0 } },
      dependencies,
    )
    const fractional = await dispatchAttack(
      { ...tenInfantryOn(tierOnePlot), units: { infantry: 1.5, cavalry: 0 } },
      dependencies,
    )

    expect(none).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
    expect(fractional).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 1.5 }))
  })

  it('refuses in order: count, slot, bounds, own plot, held plot, no camp, infantry at home', async () => {
    const away = dependenciesOver(storedFief({}))
    await dispatchMarch(
      {
        playerId: 'lord',
        province: 2,
        plot: freePlot(),
        units: { infantry: 4, cavalry: 0 },
        stayHours: 2,
      },
      away,
    )
    const idle = dependenciesOver(storedFief({}))
    const tooMany = { ...tenInfantryOn(tierOnePlot), units: { infantry: 11, cavalry: 0 } }

    const refusals = await Promise.all([
      dispatchAttack({ ...tooMany, units: { infantry: 0, cavalry: 0 }, province: 9 }, away),
      dispatchAttack({ ...tooMany, province: 9 }, away),
      dispatchAttack({ ...tooMany, province: 1, plot: 16 }, idle),
      dispatchAttack({ ...tooMany, province: 1, plot: 1 }, idle),
      dispatchAttack({ ...tooMany, plot: 9 }, idle),
      dispatchAttack({ ...tooMany, plot: freePlot() }, idle),
      dispatchAttack(tooMany, idle),
    ])

    expect(refusals.map((refusal) => (refusal.ok ? 'sent' : refusal.error.kind))).toEqual([
      'InvalidUnitCount',
      'MarchSlotBusy',
      'MarchTargetOutOfBounds',
      'MarchToOwnPlot',
      'PlotHeld',
      'PlotHasNoCamp',
      'NotEnoughUnitsAtHome',
    ])
  })
})

describe('dispatchAttack with a party of several kinds', () => {
  it('times an attack of riders alone at half the road', async () => {
    const dependencies = dependenciesOver(
      storedFief({
        address: { kingdom: 1, province: 3, plot: 12 },
        units: { infantry: 12, cavalry: 6 },
      }),
    )

    const result = await dispatchAttack(
      { playerId: 'lord', province: 2, plot: 1, units: { infantry: 0, cavalry: 6 } },
      dependencies,
    )

    assert(result.ok)
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toMatchObject({
      units: { infantry: 0, cavalry: 6 },
      oneWaySeconds: 630,
    })
  })
})

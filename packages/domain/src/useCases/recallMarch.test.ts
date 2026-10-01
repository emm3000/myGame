import { assert, describe, expect, it } from 'vitest'
import { Fief, type StoredFief } from '../fief/Fief'
import type { AwayMarch } from '../march/March'
import { marchInstantsOf } from '../march/marchInstantsOf'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryCampRegistry } from '../testing/inMemoryCampRegistry'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { recallMarch } from './recallMarch'
import { resolveUpgrade } from './resolveUpgrade'

const departedAt = Instant.fromEpochMilliseconds(86_400_000)

const secondsAfterDeparture = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(departedAt.epochMilliseconds + seconds * 1_000)

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

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const smallCarry: FiefSettings['units'] = { infantry: { ...plainUnits.infantry, carry: 4 } }

const tenInfantryForTwoHours: AwayMarch = {
  kind: 'away',
  order: 'forage',
  province: 2,
  plot: 5,
  infantry: 10,
  stayHours: 2,
  departedAt,
  oneWaySeconds: 840,
  loot: { ...noLoot, wood: 60, stone: 60 },
}

const tenInfantryAttacking: AwayMarch = {
  kind: 'away',
  order: 'attack',
  province: 2,
  plot: 1,
  infantry: 10,
  stayHours: 0,
  departedAt,
  oneWaySeconds: 600,
  loot: { ...noLoot, wood: 96, stone: 96, gold: 96 },
  camp: { tier: 1, strength: 6 },
  fought: false,
}

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 1 },
    stocks: { wood: 500, stone: 100, iron: 300, gold: 100, food: 500 },
    storedAt: departedAt,
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
    march: tenInfantryForTwoHours,
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

const dependenciesAt = (seconds: number, fief: Fief = storedFief({})) => ({
  fiefs: inMemoryFiefRepository([fief]),
  catalog,
  clock: frozenClock(secondsAfterDeparture(seconds)),
})

const recall = { playerId: 'lord', departedAt }

const recalledMarchOf = (dependencies: ReturnType<typeof dependenciesAt>): AwayMarch => {
  const march = dependencies.fiefs.storedFiefOf('lord')?.march
  assert(march?.kind === 'away')
  return march
}

describe('recallMarch', () => {
  it('turns back where it stands when recalled on the way out', async () => {
    const dependencies = dependenciesAt(300)

    const result = await recallMarch(recall, dependencies)

    assert(result.ok)
    const recalled = recalledMarchOf(dependencies)
    expect(recalled).toMatchObject({ recalledAt: secondsAfterDeparture(300), loot: noLoot })
    expect(marchInstantsOf(recalled).returnsAt).toEqual(secondsAfterDeparture(600))
  })

  it('reads a recall at the arrival as foraging with no loot', async () => {
    const dependencies = dependenciesAt(840)

    await recallMarch(recall, dependencies)

    const recalled = recalledMarchOf(dependencies)
    expect(recalled.loot).toEqual(noLoot)
    expect(marchInstantsOf(recalled).returnsAt).toEqual(secondsAfterDeparture(1_680))
  })

  it('recalls an attack on the way out with nothing', async () => {
    const dependencies = dependenciesAt(599, storedFief({ march: tenInfantryAttacking }))

    const result = await recallMarch(recall, dependencies)

    assert(result.ok)
    const recalled = recalledMarchOf(dependencies)
    expect(recalled).toMatchObject({ recalledAt: secondsAfterDeparture(599), loot: noLoot })
    expect(marchInstantsOf(recalled).returnsAt).toEqual(secondsAfterDeparture(1_198))
  })

  it('refuses a recall at the battle', async () => {
    const dependencies = dependenciesAt(600, storedFief({ march: tenInfantryAttacking }))

    const result = await recallMarch(recall, dependencies)

    expect(result).toEqual(err({ kind: 'MarchAlreadyReturning' }))
    expect(dependencies.fiefs.storedFiefOf('lord')?.march).toEqual(tenInfantryAttacking)
  })

  it('brings the loot of the seconds foraged', async () => {
    const dependencies = dependenciesAt(2_640)

    await recallMarch(recall, dependencies)

    const recalled = recalledMarchOf(dependencies)
    expect(recalled.loot).toEqual({ ...noLoot, wood: 15, stone: 15 })
    expect(marchInstantsOf(recalled).returnsAt).toEqual(secondsAfterDeparture(3_480))
  })

  it('floors the loot of a partial forage', async () => {
    const dependencies = dependenciesAt(1_840)

    await recallMarch(recall, dependencies)

    expect(recalledMarchOf(dependencies).loot).toEqual({ ...noLoot, wood: 8, stone: 8 })
  })

  it('caps the partial loot at the carry share', async () => {
    const dependencies = {
      ...dependenciesAt(8_000),
      catalog: { ...catalog, fiefSettings: () => ({ ...fiefSettings, units: smallCarry }) },
    }

    await recallMarch(recall, dependencies)

    expect(recalledMarchOf(dependencies).loot).toEqual({ ...noLoot, wood: 20, stone: 20 })
  })

  it('keeps the stocks, the stored instant, the units and the other slots', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesAt(2_640, fief)

    await recallMarch(recall, dependencies)

    const recalled = dependencies.fiefs.storedFiefOf('lord')
    assert(recalled !== undefined)
    const { stocks, storedAt, units, slot, buildQueue, studySlot, recruitOrder } = recalled
    expect({ stocks, storedAt, units, slot, buildQueue, studySlot, recruitOrder }).toEqual({
      stocks: fief.stocks,
      storedAt: fief.storedAt,
      units: fief.units,
      slot: fief.slot,
      buildQueue: fief.buildQueue,
      studySlot: fief.studySlot,
      recruitOrder: fief.recruitOrder,
    })
  })

  it('refuses a recall once the stay has ended', async () => {
    const result = await recallMarch(recall, dependenciesAt(8_040))

    expect(result).toEqual(err({ kind: 'MarchAlreadyReturning' }))
  })

  it('refuses a second recall', async () => {
    const dependencies = dependenciesAt(2_640)
    await recallMarch(recall, dependencies)

    const result = await recallMarch(recall, dependencies)

    expect(result).toEqual(err({ kind: 'MarchAlreadyReturning' }))
  })

  it('refuses a recall naming another departure', async () => {
    const otherDeparture = secondsAfterDeparture(-60)

    const result = await recallMarch(
      { playerId: 'lord', departedAt: otherDeparture },
      dependenciesAt(2_640),
    )

    expect(result).toEqual(err({ kind: 'MarchNotFound', departedAt: otherDeparture }))
  })

  it('refuses a recall with the march slot idle', async () => {
    const result = await recallMarch(
      recall,
      dependenciesAt(2_640, storedFief({ march: { kind: 'idle' } })),
    )

    expect(result).toEqual(err({ kind: 'MarchNotFound', departedAt }))
  })

  it('writes nothing when it refuses', async () => {
    const fief = storedFief({})
    const dependencies = dependenciesAt(8_040, fief)

    await recallMarch(recall, dependencies)

    expect(dependencies.fiefs.storedFiefOf('lord')).toBe(fief)
  })

  it('refuses a player who holds no fief', async () => {
    const result = await recallMarch({ ...recall, playerId: 'landless' }, dependenciesAt(2_640))

    expect(result).toEqual(err({ kind: 'FiefNotFound', playerId: 'landless' }))
  })

  it('reports a fief the repository cannot read', async () => {
    const dependencies = dependenciesAt(2_640)
    const unreadable = {
      ...dependencies,
      fiefs: {
        ...dependencies.fiefs,
        fiefOf: async () => err({ kind: 'NegativeResourceAmount', amount: -1 } as const),
      },
    }

    const result = await recallMarch(recall, unreadable)

    expect(result).toEqual(err({ kind: 'NegativeResourceAmount', amount: -1 }))
  })

  it('reports a recall the repository refuses to save', async () => {
    const dependencies = dependenciesAt(2_640)
    const unsaveable = {
      ...dependencies,
      fiefs: {
        ...dependencies.fiefs,
        save: async (fief: Fief) =>
          err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates } as const),
      },
    }

    const result = await recallMarch(recall, unsaveable)

    expect(result).toEqual(
      err({ kind: 'CoordinatesTaken', coordinates: storedFief({}).coordinates }),
    )
  })

  it('brings the recalled march home at its derived return', async () => {
    const dependencies = dependenciesAt(2_640)
    await recallMarch(recall, dependencies)
    const chronicle = inMemoryChronicle()

    const result = await resolveUpgrade(
      { playerId: 'lord' },
      {
        ...dependencies,
        chronicle,
        camps: inMemoryCampRegistry([]),
        clock: frozenClock(secondsAfterDeparture(3_480)),
      },
    )

    assert(result.ok)
    expect(result.value.fief.march).toEqual({ kind: 'idle' })
    expect(result.value.fief.storedAt).toEqual(secondsAfterDeparture(3_480))
    expect(result.value.events).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 5,
        infantry: 10,
        loot: { ...noLoot, wood: 15, stone: 15 },
        recalled: true,
        occurredAt: secondsAfterDeparture(3_480),
      },
    ])
  })
})

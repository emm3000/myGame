import { assert, describe, expect, it } from 'vitest'
import type { BuildQueueEntry } from '../fief/BuildQueue'
import { Fief, type Stocks, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type {
  BuildingCatalog,
  BuildingLevel,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { Instant } from '../time/Instant'
import { enqueueBuilding } from './enqueueBuilding'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const oneHourLater = Instant.fromEpochMilliseconds(86_400_000 + 3_600_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
}

const sawmillCost: Stocks = { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 }

const sawmillLevel = (level: number, peasantOccupancy: number): ProducerLevel => ({
  building: 'sawmill',
  level,
  cost: sawmillCost,
  durationSeconds: 90,
  peasantOccupancy,
  ratePerHour: 30,
})

const quarryLevelOne: ProducerLevel = {
  building: 'quarry',
  level: 1,
  cost: { wood: 50, stone: 20, iron: 0, gold: 0, food: 0 },
  durationSeconds: 100,
  peasantOccupancy: 1,
  ratePerHour: 20,
}

const farmLevelOne: FarmLevel = {
  building: 'farm',
  level: 1,
  cost: { wood: 70, stone: 20, iron: 0, gold: 0, food: 0 },
  durationSeconds: 120,
  peasantOccupancy: 1,
  ratePerHour: 25,
  peasantSupply: 5,
}

const ironMineLevelOne: ProducerLevel = {
  building: 'ironMine',
  level: 1,
  cost: { wood: 40, stone: 40, iron: 0, gold: 0, food: 0 },
  durationSeconds: 150,
  peasantOccupancy: 3,
  ratePerHour: 15,
}

const quarryEntry: BuildQueueEntry = {
  building: 'quarry',
  targetLevel: 1,
  cost: quarryLevelOne.cost,
  durationSeconds: 100,
}

const inMemoryCatalog = (levels: ReadonlyArray<BuildingLevel>): BuildingCatalog => ({
  levelOf: (building, level) =>
    levels.find((known) => known.building === building && known.level === level),
  fiefSettings: () => fiefSettings,
})

const twoLevelCatalog = inMemoryCatalog([
  sawmillLevel(1, 1),
  sawmillLevel(2, 2),
  quarryLevelOne,
  farmLevelOne,
])

const unbuiltLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
}

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: storedInstant,
    buildingLevels: unbuiltLevels,
    slot: { kind: 'idle' },
    buildQueue: [],
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

const sawmillFinishing = Instant.fromEpochMilliseconds(86_400_000 + 7_200_000)

const busySawmillFief = (overrides: Partial<StoredFief>): Fief =>
  storedFief({
    slot: {
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: sawmillFinishing,
      cost: sawmillCost,
    },
    ...overrides,
  })

describe('enqueueBuilding', () => {
  it('starts the upgrade in a free slot', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.slot).toEqual({
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 90_000),
      cost: sawmillCost,
    })
  })

  it('debits the cost from the amounts materialized at now', async () => {
    const quarryWorkingFief = storedFief({ buildingLevels: { ...unbuiltLevels, quarry: 1 } })
    const fiefs = inMemoryFiefRepository([quarryWorkingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.stocks).toEqual({ wood: 50, stone: 115, iron: 115, gold: 102, food: 100 })
    expect(stored?.storedAt).toBe(oneHourLater)
  })

  it('stamps the busy slot with the instant the upgrade started', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.slot).toMatchObject({
      kind: 'busy',
      startedAt: oneHourLater,
    })
  })

  it('stores the debited cost on the busy slot', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'quarry' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.stocks).toEqual({ wood: 50, stone: 80, iron: 100, gold: 100, food: 100 })
    expect(stored?.slot).toMatchObject({
      kind: 'busy',
      cost: { wood: 50, stone: 20, iron: 0, gold: 0, food: 0 },
    })
  })

  it('queues an upgrade behind the busy slot', async () => {
    const fiefs = inMemoryFiefRepository([busySawmillFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'quarry' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.slot).toMatchObject({ kind: 'busy', building: 'sawmill', targetLevel: 1 })
    expect(
      stored?.buildQueue.map(({ building, targetLevel }) => ({ building, targetLevel })),
    ).toEqual([{ building: 'quarry', targetLevel: 1 }])
  })

  it('charges a queued upgrade at enqueue', async () => {
    const fiefs = inMemoryFiefRepository([busySawmillFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'quarry' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('lord')
    expect(stored?.stocks).toEqual({ wood: 60, stone: 90, iron: 115, gold: 102, food: 110 })
    expect(stored?.storedAt).toBe(oneHourLater)
  })

  it('fixes the cost and duration of a queued upgrade at enqueue', async () => {
    const fiefs = inMemoryFiefRepository([busySawmillFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'quarry' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('lord')?.buildQueue).toEqual([
      {
        building: 'quarry',
        targetLevel: 1,
        cost: { wood: 50, stone: 20, iron: 0, gold: 0, food: 0 },
        durationSeconds: 100,
      },
    ])
  })

  it('targets the level after the busy slot and every waiting entry', async () => {
    const threeLevelCatalog = inMemoryCatalog([
      sawmillLevel(1, 1),
      sawmillLevel(2, 2),
      sawmillLevel(3, 3),
      quarryLevelOne,
    ])
    const sawmillEntry: BuildQueueEntry = {
      building: 'sawmill',
      targetLevel: 2,
      cost: sawmillCost,
      durationSeconds: 90,
    }
    const fiefs = inMemoryFiefRepository([busySawmillFief({ buildQueue: [sawmillEntry] })])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: threeLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(
      result.value.buildQueue.map(({ building, targetLevel }) => ({ building, targetLevel })),
    ).toEqual([
      { building: 'sawmill', targetLevel: 2 },
      { building: 'sawmill', targetLevel: 3 },
    ])
  })

  it('counts the peasants a queued farm supplies', async () => {
    const handHungryCatalog = inMemoryCatalog([
      sawmillLevel(1, 1),
      sawmillLevel(2, 5),
      quarryLevelOne,
      farmLevelOne,
    ])
    const farmEntry: BuildQueueEntry = {
      building: 'farm',
      targetLevel: 1,
      cost: farmLevelOne.cost,
      durationSeconds: 120,
    }
    const farmWaitingFief = busySawmillFief({
      buildingLevels: { ...unbuiltLevels, quarry: 1 },
      buildQueue: [farmEntry],
    })
    const fiefs = inMemoryFiefRepository([farmWaitingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: handHungryCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(result.value.buildQueue.at(-1)).toMatchObject({ building: 'sawmill', targetLevel: 2 })
  })

  it('charges the peasants a queued building occupies', async () => {
    const minedCatalog = inMemoryCatalog([sawmillLevel(1, 1), quarryLevelOne, ironMineLevelOne])
    const fiefs = inMemoryFiefRepository([busySawmillFief({ buildQueue: [quarryEntry] })])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'ironMine' },
      { fiefs, catalog: minedCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeasants', requiredPeasants: 3, freePeasants: 2 },
    })
  })

  it('refuses a level beyond the catalog cap after the waiting entries', async () => {
    const sawmillEntry: BuildQueueEntry = {
      building: 'sawmill',
      targetLevel: 2,
      cost: sawmillCost,
      durationSeconds: 90,
    }
    const fiefs = inMemoryFiefRepository([busySawmillFief({ buildQueue: [sawmillEntry] })])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'MaxLevelReached', building: 'sawmill', level: 2 },
    })
  })

  it('refuses an upgrade with the queue full', async () => {
    const fullQueue = [quarryEntry, quarryEntry, quarryEntry, quarryEntry]
    const fiefs = inMemoryFiefRepository([busySawmillFief({ buildQueue: fullQueue })])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'farm' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'QueueFull', cap: 4 } })
  })

  it('refuses a full queue before judging the level', async () => {
    const fullQueue = [quarryEntry, quarryEntry, quarryEntry, quarryEntry]
    const fiefs = inMemoryFiefRepository([busySawmillFief({ buildQueue: fullQueue })])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'quarry' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'QueueFull', cap: 4 } })
  })

  it('queues an upgrade behind waiting entries even with the slot idle', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ buildQueue: [quarryEntry] })])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(result.value.slot).toEqual({ kind: 'idle' })
    expect(result.value.buildQueue).toEqual([
      quarryEntry,
      { building: 'sawmill', targetLevel: 1, cost: sawmillCost, durationSeconds: 90 },
    ])
  })

  it('refuses an upgrade the stocks cannot pay for', async () => {
    const poorFief = storedFief({ stocks: { wood: 20, stone: 100, iron: 0, gold: 0, food: 4 } })
    const fiefs = inMemoryFiefRepository([poorFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'InsufficientResources',
        missing: { wood: 40, stone: 0, iron: 0, gold: 0, food: 6 },
      },
    })
  })

  it('refuses an upgrade the free peasants cannot staff', async () => {
    const handHungryCatalog = inMemoryCatalog([sawmillLevel(1, 5), quarryLevelOne])
    const quarryWorkingFief = storedFief({ buildingLevels: { ...unbuiltLevels, quarry: 1 } })
    const fiefs = inMemoryFiefRepository([quarryWorkingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: handHungryCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeasants', requiredPeasants: 5, freePeasants: 3 },
    })
  })

  it('refuses a building the catalog does not know', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'warehouse' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'UnknownBuilding', building: 'warehouse' } })
  })

  it('refuses a level beyond the catalog cap', async () => {
    const cappedSawmillFief = storedFief({ buildingLevels: { ...unbuiltLevels, sawmill: 2 } })
    const fiefs = inMemoryFiefRepository([cappedSawmillFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'MaxLevelReached', building: 'sawmill', level: 2 },
    })
  })

  it('writes nothing when it refuses', async () => {
    const poorFief = storedFief({ stocks: { wood: 20, stone: 100, iron: 0, gold: 0, food: 4 } })
    const fiefs = inMemoryFiefRepository([poorFief])
    const before = JSON.stringify(fiefs.storedFiefOf('lord'))

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(oneHourLater) },
    )

    assert(!result.ok)
    expect(JSON.stringify(fiefs.storedFiefOf('lord'))).toBe(before)
  })

  it('refuses a player who holds no fief', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await enqueueBuilding(
      { playerId: 'landless', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'FiefNotFound', playerId: 'landless' } })
  })

  it('reports a stored fief the repository cannot restore', async () => {
    const corruptFiefs: FiefRepository = {
      ...inMemoryFiefRepository([]),
      fiefOf: async () => err({ kind: 'NegativeResourceAmount', amount: -1 }),
    }

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs: corruptFiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -1 } })
  })

  it('replaces the stored fief instead of adding a second one', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: twoLevelCatalog, clock: frozenClock(storedInstant) },
    )

    expect(fiefs.savedFiefs().map((saved) => saved.slot.kind)).toEqual(['busy'])
  })

  it('releases the current level occupancy when staffing the upgrade', async () => {
    const handHungryLevelTwoCatalog = inMemoryCatalog([
      sawmillLevel(1, 1),
      sawmillLevel(2, 3),
      quarryLevelOne,
    ])
    const workingFief = storedFief({ buildingLevels: { ...unbuiltLevels, sawmill: 1, quarry: 1 } })
    const fiefs = inMemoryFiefRepository([workingFief])

    const result = await enqueueBuilding(
      { playerId: 'lord', building: 'sawmill' },
      { fiefs, catalog: handHungryLevelTwoCatalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(result.value.slot).toMatchObject({ kind: 'busy', building: 'sawmill', targetLevel: 2 })
  })
})

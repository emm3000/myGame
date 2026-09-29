import { assert, describe, expect, it } from 'vitest'
import { err } from '../Result'
import { Instant } from '../time/Instant'
import type { BuildQueueEntry } from './BuildQueue'
import { Coordinates } from './Coordinates'
import { Fief, type Stocks, type StoredFief } from './Fief'
import { FiefName } from './FiefName'

const foundingInstant = Instant.fromEpochMilliseconds(86_400_000)

const quarryCost: Stocks = { wood: 50, stone: 20, iron: 0, gold: 0, food: 0 }

const smithingCost: Stocks = { wood: 30, stone: 0, iron: 60, gold: 25, food: 0 }

const sawmillEntry: BuildQueueEntry = {
  building: 'sawmill',
  targetLevel: 3,
  cost: { wood: 90, stone: 40, iron: 0, gold: 0, food: 0 },
  durationSeconds: 240,
}

const farmEntry: BuildQueueEntry = {
  building: 'farm',
  targetLevel: 2,
  cost: { wood: 60, stone: 30, iron: 0, gold: 0, food: 10 },
  durationSeconds: 180,
}

const openOrder = {
  kind: 'open',
  unit: 'infantry',
  count: 5,
  cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
  perUnitSeconds: 45,
  startedAt: foundingInstant,
} as const

const awayMarch = {
  kind: 'away',
  province: 3,
  plot: 5,
  infantry: 3,
  stayHours: 2,
  departedAt: foundingInstant,
  oneWaySeconds: 720,
  loot: { wood: 0, stone: 18, iron: 18, gold: 0, food: 0 },
} as const

const storedBusyFief: StoredFief = {
  id: 'fief-1',
  playerId: 'founder',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 2, plot: 7 },
  stocks: { wood: 120, stone: 80, iron: 20, gold: 5, food: 60 },
  storedAt: foundingInstant,
  buildingLevels: {
    sawmill: 2,
    quarry: 1,
    ironMine: 0,
    farm: 1,
    warehouse: 0,
    library: 0,
    barracks: 0,
  },
  artLevels: { smithing: 2, masonry: 0 },
  units: { infantry: 4 },
  slot: {
    kind: 'busy',
    building: 'quarry',
    targetLevel: 2,
    startedAt: foundingInstant,
    finishesAt: Instant.fromEpochMilliseconds(86_500_000),
    cost: quarryCost,
  },
  buildQueue: [sawmillEntry, farmEntry],
  studySlot: {
    kind: 'busy',
    art: 'smithing',
    targetLevel: 3,
    startedAt: foundingInstant,
    finishesAt: Instant.fromEpochMilliseconds(86_700_000),
    cost: smithingCost,
  },
  recruitOrder: openOrder,
  march: awayMarch,
}

const fiefInProvince = (province: number): Fief => {
  const coordinates = Coordinates.create(1, province, 1)
  const name = FiefName.create('Vado Viejo')
  assert(coordinates.ok && name.ok)
  return Fief.found({
    id: 'fief-1',
    playerId: 'founder',
    name: name.value,
    coordinates: coordinates.value,
    startingStocks: { wood: 40, stone: 30, iron: 20, gold: 5, food: 35 },
    at: foundingInstant,
  })
}

describe('Fief', () => {
  it('reads its terrain from the province rotation', () => {
    const terrains = [1, 2, 3, 4, 5, 6].map((province) => fiefInProvince(province).terrain)

    expect(terrains).toEqual(['lowlands', 'uplands', 'ridges', 'lowlands', 'uplands', 'ridges'])
  })

  it('restores a stored fief with every stored value', () => {
    const restored = Fief.restore(storedBusyFief)

    assert(restored.ok)
    const {
      id,
      playerId,
      name,
      coordinates,
      stocks,
      storedAt,
      buildingLevels,
      artLevels,
      units,
      slot,
      buildQueue,
      studySlot,
      recruitOrder,
      march,
    } = restored.value
    expect({
      id,
      playerId,
      name: name.value,
      address: {
        kingdom: coordinates.kingdom,
        province: coordinates.province,
        plot: coordinates.plot,
      },
      stocks,
      storedAt,
      buildingLevels,
      artLevels,
      units: { infantry: units.countOf('infantry') },
      slot,
      buildQueue,
      studySlot,
      recruitOrder,
      march,
    }).toEqual(storedBusyFief)
  })

  it('founds a fief with an empty build queue', () => {
    expect(fiefInProvince(1).buildQueue).toEqual([])
  })

  it('founds a fief with the library at level zero', () => {
    expect(fiefInProvince(1).buildingLevels.library).toBe(0)
  })

  it('founds a fief with the barracks at level zero', () => {
    expect(fiefInProvince(1).buildingLevels.barracks).toBe(0)
  })

  it('founds a fief with every art at level zero', () => {
    expect(fiefInProvince(1).artLevels).toEqual({ smithing: 0, masonry: 0 })
  })

  it('founds a fief with the study slot idle', () => {
    expect(fiefInProvince(1).studySlot).toEqual({ kind: 'idle' })
  })

  it('founds a fief with the recruit slot idle', () => {
    expect(fiefInProvince(1).recruitOrder).toEqual({ kind: 'idle' })
  })

  it('founds a fief with the march slot idle', () => {
    expect(fiefInProvince(1).march).toEqual({ kind: 'idle' })
  })

  it('refuses a stored march with a fractional infantry count', () => {
    const fractional = Fief.restore({ ...storedBusyFief, march: { ...awayMarch, infantry: 2.5 } })
    const none = Fief.restore({ ...storedBusyFief, march: { ...awayMarch, infantry: 0 } })

    expect(fractional).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 2.5 }))
    expect(none).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
  })

  it('refuses a stored march whose stay is not a whole count of hours from one', () => {
    const fractional = Fief.restore({ ...storedBusyFief, march: { ...awayMarch, stayHours: 1.5 } })
    const none = Fief.restore({ ...storedBusyFief, march: { ...awayMarch, stayHours: 0 } })

    expect(fractional).toEqual(err({ kind: 'StayOutOfRange', stayHours: 1.5 }))
    expect(none).toEqual(err({ kind: 'StayOutOfRange', stayHours: 0 }))
  })

  it('refuses a stored march whose road time is negative or fractional', () => {
    const negative = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, oneWaySeconds: -1 },
    })
    const fractional = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, oneWaySeconds: 0.5 },
    })

    expect(negative).toEqual(err({ kind: 'NegativeDuration', seconds: -1 }))
    expect(fractional).toEqual(err({ kind: 'FractionalDuration', seconds: 0.5 }))
  })

  it('refuses a stored march with a negative loot', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, loot: { ...awayMarch.loot, stone: -1 } },
    })

    expect(restored).toEqual(err({ kind: 'NegativeResourceAmount', amount: -1 }))
  })

  it('refuses a stored march that returned before the fief was stored', () => {
    const returnsAt = Instant.fromEpochMilliseconds(86_399_000)
    const returnedBefore = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, departedAt: Instant.fromEpochMilliseconds(77_759_000) },
    })
    const returningAtStored = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, departedAt: Instant.fromEpochMilliseconds(77_760_000) },
    })

    expect(returnedBefore).toEqual(
      err({ kind: 'SlotFinishesBeforeStored', storedAt: foundingInstant, finishesAt: returnsAt }),
    )
    expect(returningAtStored.ok).toBe(true)
  })

  it('counts the infantry away out of those at home', () => {
    const restored = Fief.restore({ ...storedBusyFief, recruitOrder: { kind: 'idle' } })

    assert(restored.ok)
    expect(restored.value.unitsAtHomeAt(foundingInstant).countOf('infantry')).toBe(1)
  })

  it('refuses a stored order with a fractional count', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      recruitOrder: { ...openOrder, count: 2.5 },
    })

    expect(restored).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 2.5 }))
  })

  it('refuses a stored order whose unit duration is not a whole count from one', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      recruitOrder: { ...openOrder, perUnitSeconds: 0 },
    })

    expect(restored).toEqual(err({ kind: 'InvalidUnitDuration', unit: 'infantry', seconds: 0 }))
  })

  it('refuses a stored order with a negative cost', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      recruitOrder: { ...openOrder, cost: { ...openOrder.cost, iron: -1 } },
    })

    expect(restored).toEqual(err({ kind: 'NegativeResourceAmount', amount: -1 }))
  })

  it('refuses a stored order that ended before the fief was stored', () => {
    const storedAt = Instant.fromEpochMilliseconds(86_626_000)
    const restored = Fief.restore({
      ...storedBusyFief,
      storedAt,
      slot: { kind: 'idle' },
      studySlot: { kind: 'idle' },
    })

    expect(restored).toEqual(
      err({
        kind: 'SlotFinishesBeforeStored',
        storedAt,
        finishesAt: Instant.fromEpochMilliseconds(86_625_000),
      }),
    )
  })

  it('adds the delivered units to the counts read', () => {
    const restored = Fief.restore(storedBusyFief)
    assert(restored.ok)

    const counts = restored.value.unitCountsAt(Instant.fromEpochMilliseconds(86_500_000))

    expect(counts.countOf('infantry')).toBe(6)
  })

  it('refuses a stored art level that is not a whole count', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      artLevels: { ...storedBusyFief.artLevels, masonry: 1.5 },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidArtLevel', art: 'masonry', level: 1.5 },
    })
  })

  it('refuses a stored negative art level', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      artLevels: { ...storedBusyFief.artLevels, smithing: -1 },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidArtLevel', art: 'smithing', level: -1 },
    })
  })

  it('founds a fief with no units', () => {
    expect(fiefInProvince(1).units.countOf('infantry')).toBe(0)
  })

  it('refuses a stored unit count that is not a whole count', () => {
    const restored = Fief.restore({ ...storedBusyFief, units: { infantry: 2.5 } })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidUnitCount', unit: 'infantry', count: 2.5 },
    })
  })

  it('refuses a stored negative unit count', () => {
    const restored = Fief.restore({ ...storedBusyFief, units: { infantry: -1 } })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidUnitCount', unit: 'infantry', count: -1 },
    })
  })

  it('restores the waiting entries in their order', () => {
    const restored = Fief.restore({ ...storedBusyFief, buildQueue: [farmEntry, sawmillEntry] })

    assert(restored.ok)
    expect(restored.value.buildQueue).toEqual([farmEntry, sawmillEntry])
  })

  it('refuses a stored entry whose target level is below one', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      buildQueue: [sawmillEntry, { ...farmEntry, targetLevel: 0 }],
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidBuildingLevel', building: 'farm', level: 0 },
    })
  })

  it('refuses a stored entry whose cost is negative', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      buildQueue: [{ ...sawmillEntry, cost: { ...sawmillEntry.cost, iron: -5 } }],
    })

    expect(restored).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -5 } })
  })

  it('refuses a stored entry whose duration is negative', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      buildQueue: [{ ...farmEntry, durationSeconds: -60 }],
    })

    expect(restored).toEqual({ ok: false, error: { kind: 'NegativeDuration', seconds: -60 } })
  })

  it('refuses a stored entry whose duration is not whole seconds', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      buildQueue: [{ ...farmEntry, durationSeconds: 60.5 }],
    })

    expect(restored).toEqual({ ok: false, error: { kind: 'FractionalDuration', seconds: 60.5 } })
  })

  it('refuses a stored fief with a negative amount', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      stocks: { ...storedBusyFief.stocks, iron: -3 },
    })

    expect(restored).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -3 } })
  })

  it('refuses a stored fief with a negative building level', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      buildingLevels: { ...storedBusyFief.buildingLevels, farm: -1 },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidBuildingLevel', building: 'farm', level: -1 },
    })
  })

  it('refuses a stored busy slot whose target level is below one', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      slot: {
        kind: 'busy',
        building: 'ironMine',
        targetLevel: 0,
        startedAt: foundingInstant,
        finishesAt: foundingInstant,
        cost: quarryCost,
      },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidBuildingLevel', building: 'ironMine', level: 0 },
    })
  })

  it('refuses a stored busy slot that finishes before the stored instant', () => {
    const finishesAt = Instant.fromEpochMilliseconds(86_399_000)
    const restored = Fief.restore({
      ...storedBusyFief,
      slot: {
        kind: 'busy',
        building: 'quarry',
        targetLevel: 2,
        startedAt: foundingInstant,
        finishesAt,
        cost: quarryCost,
      },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'SlotFinishesBeforeStored', storedAt: foundingInstant, finishesAt },
    })
  })

  it('refuses a stored busy slot that starts after it finishes', () => {
    const startedAt = Instant.fromEpochMilliseconds(86_600_000)
    const finishesAt = Instant.fromEpochMilliseconds(86_500_000)
    const restored = Fief.restore({
      ...storedBusyFief,
      slot: {
        kind: 'busy',
        building: 'quarry',
        targetLevel: 2,
        startedAt,
        finishesAt,
        cost: quarryCost,
      },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'SlotStartsAfterFinish', startedAt, finishesAt },
    })
  })

  it('refuses a stored busy slot whose cost is negative', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      slot: {
        kind: 'busy',
        building: 'quarry',
        targetLevel: 2,
        startedAt: foundingInstant,
        finishesAt: Instant.fromEpochMilliseconds(86_500_000),
        cost: { ...quarryCost, stone: -20 },
      },
    })

    expect(restored).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -20 } })
  })

  it('refuses a stored study whose target level is below one', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      studySlot: {
        kind: 'busy',
        art: 'masonry',
        targetLevel: 0,
        startedAt: foundingInstant,
        finishesAt: foundingInstant,
        cost: smithingCost,
      },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidArtLevel', art: 'masonry', level: 0 },
    })
  })

  it('refuses a stored study that finishes before the fief was stored', () => {
    const finishesAt = Instant.fromEpochMilliseconds(86_399_000)
    const restored = Fief.restore({
      ...storedBusyFief,
      studySlot: {
        kind: 'busy',
        art: 'smithing',
        targetLevel: 3,
        startedAt: Instant.fromEpochMilliseconds(86_000_000),
        finishesAt,
        cost: smithingCost,
      },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'SlotFinishesBeforeStored', storedAt: foundingInstant, finishesAt },
    })
  })

  it('refuses a stored study that starts after it finishes', () => {
    const startedAt = Instant.fromEpochMilliseconds(86_800_000)
    const finishesAt = Instant.fromEpochMilliseconds(86_700_000)
    const restored = Fief.restore({
      ...storedBusyFief,
      studySlot: {
        kind: 'busy',
        art: 'smithing',
        targetLevel: 3,
        startedAt,
        finishesAt,
        cost: smithingCost,
      },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'SlotStartsAfterFinish', startedAt, finishesAt },
    })
  })

  it('refuses a stored study whose cost is negative', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      studySlot: {
        kind: 'busy',
        art: 'smithing',
        targetLevel: 3,
        startedAt: foundingInstant,
        finishesAt: Instant.fromEpochMilliseconds(86_700_000),
        cost: { ...smithingCost, gold: -25 },
      },
    })

    expect(restored).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -25 } })
  })
})

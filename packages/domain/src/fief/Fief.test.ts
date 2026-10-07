import { assert, describe, expect, it } from 'vitest'
import { err } from '../Result'
import { Instant } from '../time/Instant'
import type { BuildQueueEntry } from './BuildQueue'
import { Coordinates } from './Coordinates'
import { Fief, type Stocks, type StoredFief } from './Fief'
import { FiefName } from './FiefName'
import { noStoreFull } from './FullSince'

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
  order: 'forage',
  province: 3,
  plot: 5,
  units: { infantry: 3, cavalry: 0, archer: 0, settler: 0 },
  stayHours: 2,
  departedAt: foundingInstant,
  oneWaySeconds: 720,
  loot: { wood: 0, stone: 18, iron: 18, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
} as const

const attackMarch = {
  kind: 'away',
  order: 'attack',
  province: 3,
  plot: 5,
  units: { infantry: 3, cavalry: 0, archer: 0, settler: 0 },
  stayHours: 0,
  departedAt: foundingInstant,
  oneWaySeconds: 720,
  loot: { wood: 0, stone: 16, iron: 16, gold: 16, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
  camp: { tier: 1, strength: 2 },
  fought: false,
} as const

const foundingMarch = {
  kind: 'away',
  order: 'found',
  name: 'Sotoverde del Páramo',
  province: 3,
  plot: 5,
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
  stayHours: 0,
  departedAt: foundingInstant,
  oneWaySeconds: 720,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
} as const

const transportMarch = {
  kind: 'away',
  order: 'transport',
  toFiefId: 'fief-2',
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  province: 3,
  plot: 5,
  units: { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
  stayHours: 0,
  departedAt: foundingInstant,
  oneWaySeconds: 360,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
} as const

const incomingCargo = {
  fromFiefId: 'fief-2',
  name: 'Peña Alta',
  province: 3,
  plot: 5,
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  departedAt: Instant.fromEpochMilliseconds(86_400_000 - 120_000),
  arrivesAt: Instant.fromEpochMilliseconds(86_400_000 + 360_000),
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
  units: { infantry: 4, cavalry: 2, archer: 0, settler: 0 },
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
  fullSince: noStoreFull,
  guidanceDismissedAt: Instant.fromEpochMilliseconds(86_400_000 + 60_000),
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
      fullSince,
      guidanceDismissedAt,
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
      units: {
        infantry: units.countOf('infantry'),
        cavalry: units.countOf('cavalry'),
        archer: 0,
        settler: 0,
      },
      slot,
      buildQueue,
      studySlot,
      recruitOrder,
      march,
      fullSince,
      guidanceDismissedAt,
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
    const fractional = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, units: { infantry: 2.5, cavalry: 0, archer: 0, settler: 0 } },
    })

    expect(fractional).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 2.5 }))
  })

  it('refuses a stored march with a negative rider count', () => {
    const negative = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, units: { infantry: 3, cavalry: -1, archer: 0, settler: 0 } },
    })

    expect(negative).toEqual(err({ kind: 'InvalidUnitCount', unit: 'cavalry', count: -1 }))
  })

  it('refuses a stored march with no unit', () => {
    const none = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 } },
    })

    expect(none).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 0 }))
  })

  it('restores a stored march of riders alone', () => {
    const riders = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, units: { infantry: 0, cavalry: 2, archer: 0, settler: 0 } },
    })

    assert(riders.ok)
    expect(riders.value.march).toMatchObject({
      units: { infantry: 0, cavalry: 2, archer: 0, settler: 0 },
    })
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

  it('refuses a stored march whose loot percent is below one or fractional', () => {
    const none = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, lootPercent: { ...awayMarch.lootPercent, iron: 0 } },
    })
    const fractional = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, lootPercent: { ...awayMarch.lootPercent, food: 12.5 } },
    })

    expect([none, fractional]).toEqual([
      err({ kind: 'InvalidLootPercent', resource: 'iron', percent: 0 }),
      err({ kind: 'InvalidLootPercent', resource: 'food', percent: 12.5 }),
    ])
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

  it('restores a stored attack', () => {
    const restored = Fief.restore({ ...storedBusyFief, march: attackMarch })

    assert(restored.ok)
    expect(restored.value.march).toEqual(attackMarch)
  })

  it('restores a founding march with its name', () => {
    const restored = Fief.restore({ ...storedBusyFief, march: foundingMarch })

    assert(restored.ok)
    expect(restored.value.march).toEqual(foundingMarch)
  })

  it('refuses a stored founding with two settlers', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      march: { ...foundingMarch, units: { infantry: 0, cavalry: 0, archer: 0, settler: 2 } },
    })

    expect(restored).toEqual(err({ kind: 'InvalidUnitCount', unit: 'settler', count: 2 }))
  })

  it('refuses a stored founding with a footman beside the settler', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      march: { ...foundingMarch, units: { infantry: 1, cavalry: 0, archer: 0, settler: 1 } },
    })

    expect(restored).toEqual(err({ kind: 'InvalidUnitCount', unit: 'infantry', count: 1 }))
  })

  it('refuses a stored founding with a stay', () => {
    const restored = Fief.restore({ ...storedBusyFief, march: { ...foundingMarch, stayHours: 1 } })

    expect(restored).toEqual(err({ kind: 'StayOutOfRange', stayHours: 1 }))
  })

  it('restores a transport march with its cargo', () => {
    const restored = Fief.restore({ ...storedBusyFief, march: transportMarch })

    assert(restored.ok)
    expect(restored.value.march).toEqual(transportMarch)
  })

  it('refuses a stored transport holding a settler', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      march: { ...transportMarch, units: { infantry: 0, cavalry: 6, archer: 0, settler: 1 } },
    })

    expect(restored).toEqual(
      err({ kind: 'UnitUnfitForOrder', unit: 'settler', order: 'transport' }),
    )
  })

  it('refuses a stored transport with a stay', () => {
    const restored = Fief.restore({ ...storedBusyFief, march: { ...transportMarch, stayHours: 1 } })

    expect(restored).toEqual(err({ kind: 'StayOutOfRange', stayHours: 1 }))
  })

  it('refuses a stored transport with an empty cargo', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      march: { ...transportMarch, cargo: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 } },
    })

    expect(restored).toEqual(err({ kind: 'EmptyCargo' }))
  })

  it('restores the cargo on its way to the fief', () => {
    const restored = Fief.restore({ ...storedBusyFief, incomingCargo })

    assert(restored.ok)
    expect(restored.value.incomingCargo).toEqual(incomingCargo)
  })

  it('restores no cargo on its way when none is stored', () => {
    const restored = Fief.restore(storedBusyFief)

    assert(restored.ok)
    expect(restored.value.incomingCargo).toBeUndefined()
  })

  it('refuses a negative amount of a cargo on its way', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      incomingCargo: { ...incomingCargo, cargo: { ...incomingCargo.cargo, food: -1 } },
    })

    expect(restored).toEqual(err({ kind: 'NegativeResourceAmount', amount: -1 }))
  })

  it('refuses a cargo on its way that departs after its arrival', () => {
    const departedAt = Instant.fromEpochMilliseconds(86_400_000 + 360_001)
    const restored = Fief.restore({
      ...storedBusyFief,
      incomingCargo: { ...incomingCargo, departedAt },
    })

    expect(restored).toEqual(
      err({
        kind: 'SlotStartsAfterFinish',
        startedAt: departedAt,
        finishesAt: incomingCargo.arrivesAt,
      }),
    )
  })

  it('restores a cargo on its way that departs at its arrival', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      incomingCargo: { ...incomingCargo, departedAt: incomingCargo.arrivesAt },
    })

    assert(restored.ok)
    expect(restored.value.incomingCargo?.departedAt).toEqual(incomingCargo.arrivesAt)
  })

  it('refuses a cargo on its way that arrived before the fief was stored', () => {
    const arrivesAt = Instant.fromEpochMilliseconds(86_400_000 - 1_000)
    const restored = Fief.restore({
      ...storedBusyFief,
      incomingCargo: { ...incomingCargo, arrivesAt },
    })

    expect(restored).toEqual(
      err({ kind: 'SlotFinishesBeforeStored', storedAt: foundingInstant, finishesAt: arrivesAt }),
    )
  })

  it('refuses a stored attack with a stay', () => {
    const restored = Fief.restore({ ...storedBusyFief, march: { ...attackMarch, stayHours: 1 } })

    expect(restored).toEqual(err({ kind: 'StayOutOfRange', stayHours: 1 }))
  })

  it('refuses a stored attack on a camp of no tier or of a strength that is not whole', () => {
    const tierless = Fief.restore({
      ...storedBusyFief,
      march: { ...attackMarch, camp: { tier: 4 as 1, strength: 2 } },
    })
    const negative = Fief.restore({
      ...storedBusyFief,
      march: { ...attackMarch, camp: { tier: 1, strength: -1 } },
    })
    const fractional = Fief.restore({
      ...storedBusyFief,
      march: { ...attackMarch, camp: { tier: 1, strength: 1.5 } },
    })

    expect([tierless, negative, fractional]).toEqual([
      err({ kind: 'InvalidCamp', tier: 4, strength: 2 }),
      err({ kind: 'InvalidCamp', tier: 1, strength: -1 }),
      err({ kind: 'InvalidCamp', tier: 1, strength: 1.5 }),
    ])
  })

  it('refuses a stored recall before the departure', () => {
    const recalledAt = Instant.fromEpochMilliseconds(foundingInstant.epochMilliseconds - 1_000)
    const before = Fief.restore({ ...storedBusyFief, march: { ...awayMarch, recalledAt } })
    const atDeparture = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, recalledAt: foundingInstant },
    })

    expect(before).toEqual(
      err({ kind: 'SlotStartsAfterFinish', startedAt: foundingInstant, finishesAt: recalledAt }),
    )
    expect(atDeparture.ok).toBe(true)
  })

  it('refuses a stored recall at or after the end of the stay', () => {
    const leavesAt = Instant.fromEpochMilliseconds(foundingInstant.epochMilliseconds + 7_920_000)
    const atLeave = Fief.restore({
      ...storedBusyFief,
      march: { ...awayMarch, recalledAt: leavesAt },
    })
    const justBefore = Fief.restore({
      ...storedBusyFief,
      march: {
        ...awayMarch,
        recalledAt: Instant.fromEpochMilliseconds(leavesAt.epochMilliseconds - 1_000),
      },
    })

    expect(atLeave).toEqual(
      err({ kind: 'SlotStartsAfterFinish', startedAt: leavesAt, finishesAt: leavesAt }),
    )
    expect(justBefore.ok).toBe(true)
  })

  it('restores a founding turned home at its arrival and refuses a recall after it', () => {
    const arrivesAt = Instant.fromEpochMilliseconds(foundingInstant.epochMilliseconds + 720_000)
    const afterArrival = Instant.fromEpochMilliseconds(arrivesAt.epochMilliseconds + 1_000)
    const atArrival = Fief.restore({
      ...storedBusyFief,
      march: { ...foundingMarch, recalledAt: arrivesAt },
    })
    const after = Fief.restore({
      ...storedBusyFief,
      march: { ...foundingMarch, recalledAt: afterArrival },
    })

    expect(atArrival.ok).toBe(true)
    expect(after).toEqual(
      err({ kind: 'SlotStartsAfterFinish', startedAt: afterArrival, finishesAt: arrivesAt }),
    )
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
    const restored = Fief.restore({
      ...storedBusyFief,
      units: { infantry: 2.5, cavalry: 0, archer: 0, settler: 0 },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidUnitCount', unit: 'infantry', count: 2.5 },
    })
  })

  it('refuses a stored negative unit count', () => {
    const restored = Fief.restore({
      ...storedBusyFief,
      units: { infantry: -1, cavalry: 0, archer: 0, settler: 0 },
    })

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

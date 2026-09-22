import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { Coordinates } from './Coordinates'
import { Fief, type StoredFief } from './Fief'
import { FiefName } from './FiefName'

const foundingInstant = Instant.fromEpochMilliseconds(86_400_000)

const storedBusyFief: StoredFief = {
  id: 'fief-1',
  playerId: 'founder',
  name: 'Vado Viejo',
  address: { kingdom: 1, province: 2, plot: 7 },
  stocks: { wood: 120, stone: 80, iron: 20, gold: 5, food: 60 },
  storedAt: foundingInstant,
  buildingLevels: { sawmill: 2, quarry: 1, ironMine: 0, farm: 1, warehouse: 0 },
  slot: {
    kind: 'busy',
    building: 'quarry',
    targetLevel: 2,
    startedAt: foundingInstant,
    finishesAt: Instant.fromEpochMilliseconds(86_500_000),
  },
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
    const { id, playerId, name, coordinates, stocks, storedAt, buildingLevels, slot } =
      restored.value
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
      slot,
    }).toEqual(storedBusyFief)
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
      slot: { kind: 'busy', building: 'quarry', targetLevel: 2, startedAt, finishesAt },
    })

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'SlotStartsAfterFinish', startedAt, finishesAt },
    })
  })
})

import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { Fief } from './Fief'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import { noStoreFull } from './FullSince'
import { freeSlotsOf } from './freeSlotsOf'

const idleFiefWith = (buildingLevels: Partial<FiefBuildingLevels>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'founder',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 7 },
    stocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
    storedAt: Instant.fromEpochMilliseconds(86_400_000),
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 0,
      ...buildingLevels,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
  })
  assert(restored.ok)
  return restored.value
}

describe('freeSlotsOf', () => {
  it('counts the study slot free only from library level 1', () => {
    const withoutLibrary = idleFiefWith({ library: 0 })
    const withLibrary = idleFiefWith({ library: 1 })

    expect(freeSlotsOf(withoutLibrary)).not.toContain('study')
    expect(freeSlotsOf(withLibrary)).toContain('study')
  })

  it('counts the recruit and march slots free only from barracks level 1', () => {
    const withoutBarracks = idleFiefWith({ barracks: 0 })
    const withBarracks = idleFiefWith({ barracks: 1 })

    expect(freeSlotsOf(withoutBarracks)).toEqual(['build'])
    expect(freeSlotsOf(withBarracks)).toEqual(['build', 'recruit', 'march'])
  })
})

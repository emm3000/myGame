import { describe, expect, it } from 'vitest'
import { storedTownOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { Town } from './Town'
import { TownAddress } from './TownAddress'
import { terrainOf } from './terrainOf'

const storedAt = Instant.fromEpochMilliseconds(1_791_244_800_000)

describe('Town', () => {
  it('refuses to restore a stock that is negative or fractional', () => {
    const restored = Town.restore(
      storedTownOf({ storedAt, stocks: { money: 10, food: 2.5, power: 0, material: 0 } }),
    )

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidTownStock', resource: 'food', amount: 2.5 },
    })
  })

  it('refuses to restore a building level below 0', () => {
    const restored = Town.restore(storedTownOf({ storedAt, buildingLevels: { storage: -1 } }))

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidTownBuildingLevel', building: 'storage', level: -1 },
    })
  })

  it('refuses an address whose area is not a whole number from 1', () => {
    expect(TownAddress.create(1, 0, 3)).toEqual({
      ok: false,
      error: { kind: 'InvalidTownAddress', region: 1, area: 0, site: 3 },
    })
  })

  it('rotates the terrain fields, river, hills by area', () => {
    expect([1, 2, 3, 4, 5, 6].map(terrainOf)).toEqual([
      'fields',
      'river',
      'hills',
      'fields',
      'river',
      'hills',
    ])
  })
})

import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { Coordinates } from './Coordinates'
import { Fief } from './Fief'
import { FiefName } from './FiefName'

const foundingInstant = Instant.fromEpochMilliseconds(86_400_000)

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
})

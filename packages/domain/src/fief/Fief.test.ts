import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { Coordinates } from './Coordinates'
import { Fief } from './Fief'

const foundingInstant = Instant.fromEpochMilliseconds(86_400_000)

const coordinatesAt = (kingdom: number, province: number, plot: number): Coordinates => {
  const result = Coordinates.create(kingdom, province, plot)
  assert(result.ok)
  return result.value
}

const foundingOf = (province: number): Parameters<typeof Fief.found>[0] => ({
  id: 'fief-1',
  playerId: 'founder',
  name: 'Vado Viejo',
  coordinates: coordinatesAt(1, province, 1),
  startingStocks: { wood: 40, stone: 30, iron: 20, gold: 5, food: 35 },
  at: foundingInstant,
})

describe('Fief', () => {
  it('reads its terrain from the province rotation', () => {
    const terrains = [1, 2, 3, 4, 5, 6].map((province) => {
      const result = Fief.found(foundingOf(province))
      assert(result.ok)
      return result.value.terrain
    })

    expect(terrains).toEqual(['lowlands', 'uplands', 'ridges', 'lowlands', 'uplands', 'ridges'])
  })

  it('trims the name the player chose', () => {
    const result = Fief.found({ ...foundingOf(1), name: '  Vado Viejo  ' })

    assert(result.ok)
    expect(result.value.name).toBe('Vado Viejo')
  })

  it('refuses a negative starting stock', () => {
    const result = Fief.found({
      ...foundingOf(1),
      startingStocks: { wood: 40, stone: 30, iron: -1, gold: 5, food: 35 },
    })

    expect(result).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -1 } })
  })
})

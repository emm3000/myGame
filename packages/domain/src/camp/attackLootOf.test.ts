import { describe, expect, it } from 'vitest'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { attackLootOf } from './attackLootOf'

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

describe('attackLootOf', () => {
  it('splits the loot in thirds with gold', () => {
    expect(attackLootOf('uplands', 15, 22, plainCamps, plainForage)).toEqual({
      ...noLoot,
      wood: 300,
      stone: 300,
      gold: 300,
    })
  })

  it('caps the loot at the survivors carry', () => {
    expect(attackLootOf('lowlands', 6, 6, plainCamps, plainForage)).toEqual({
      ...noLoot,
      wood: 96,
      food: 96,
      gold: 96,
    })
  })

  it('brings nothing from a lost battle', () => {
    expect(attackLootOf('ridges', 15, 0, plainCamps, plainForage)).toEqual(noLoot)
  })
})

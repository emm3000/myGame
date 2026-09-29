import { describe, expect, it } from 'vitest'
import type { ForageTerms } from '../ports/BuildingCatalog'
import { plainForage } from '../testing/plainForage'
import { forageLootOf } from './forageLootOf'

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const smallCarry: ForageTerms = { ...plainForage, carryPerInfantry: 4 }

describe('forageLootOf', () => {
  it('forages food and wood on the lowlands', () => {
    expect(forageLootOf('lowlands', 1, 1, plainForage)).toEqual({ ...noLoot, food: 3, wood: 3 })
  })

  it('forages wood and stone on the uplands', () => {
    expect(forageLootOf('uplands', 10, 2, plainForage)).toEqual({ ...noLoot, wood: 60, stone: 60 })
  })

  it('caps each foraged resource at an even share of the carry', () => {
    expect(forageLootOf('uplands', 1, 1, smallCarry)).toEqual({ ...noLoot, wood: 2, stone: 2 })
    expect(forageLootOf('uplands', 10, 8, plainForage)).toEqual({
      ...noLoot,
      wood: 240,
      stone: 240,
    })
  })

  it('never forages gold', () => {
    expect(forageLootOf('ridges', 10, 8, plainForage).gold).toBe(0)
  })
})

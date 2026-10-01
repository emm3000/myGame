import { describe, expect, it } from 'vitest'
import type { MarchTerms } from '../fief/Fief'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { forageLootOf } from './forageLootOf'

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const shippedTerms: MarchTerms = { forage: plainForage, units: plainUnits }

const carryOf = (carry: number): MarchTerms => ({
  ...shippedTerms,
  units: { infantry: { ...plainUnits.infantry, carry } },
})

const goldOnTheRidges: MarchTerms = {
  ...shippedTerms,
  forage: {
    ...plainForage,
    yieldPerHour: {
      ...plainForage.yieldPerHour,
      ridges: { ...noLoot, stone: 3, iron: 3, gold: 3 },
    },
  },
}

describe('forageLootOf', () => {
  it('forages food and wood on the lowlands', () => {
    expect(forageLootOf('lowlands', 1, 1, shippedTerms)).toEqual({ ...noLoot, food: 3, wood: 3 })
  })

  it('forages wood and stone on the uplands', () => {
    expect(forageLootOf('uplands', 10, 2, shippedTerms)).toEqual({ ...noLoot, wood: 60, stone: 60 })
  })

  it('caps each foraged resource at an even share of the carry', () => {
    expect(forageLootOf('uplands', 1, 1, carryOf(4))).toEqual({ ...noLoot, wood: 2, stone: 2 })
    expect(forageLootOf('uplands', 10, 8, shippedTerms)).toEqual({
      ...noLoot,
      wood: 240,
      stone: 240,
    })
  })

  it('caps the forage at the carry the unit terms give', () => {
    expect(forageLootOf('uplands', 2, 8, carryOf(10))).toEqual({ ...noLoot, wood: 10, stone: 10 })
  })

  it('never forages gold', () => {
    expect(forageLootOf('ridges', 10, 8, goldOnTheRidges)).toEqual({
      ...noLoot,
      stone: 240,
      iron: 240,
    })
  })
})

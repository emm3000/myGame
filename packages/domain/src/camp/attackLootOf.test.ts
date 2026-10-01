import { describe, expect, it } from 'vitest'
import type { AttackTerms } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { attackLootOf } from './attackLootOf'

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const partyOf = (infantry: number, cavalry: number): UnitCountsByKind => ({ infantry, cavalry })

const shippedTerms: AttackTerms = { forage: plainForage, camps: plainCamps, units: plainUnits }

const smallCarry: AttackTerms = {
  ...shippedTerms,
  units: { ...plainUnits, infantry: { ...plainUnits.infantry, carry: 10 } },
}

describe('attackLootOf', () => {
  it('splits the loot in thirds with gold', () => {
    expect(attackLootOf('uplands', 15, partyOf(22, 0), shippedTerms)).toEqual({
      ...noLoot,
      wood: 300,
      stone: 300,
      gold: 300,
    })
  })

  it('caps the loot at the survivors carry', () => {
    expect(attackLootOf('lowlands', 6, partyOf(6, 0), shippedTerms)).toEqual({
      ...noLoot,
      wood: 96,
      food: 96,
      gold: 96,
    })
  })

  it('caps the loot at the carry the unit terms give', () => {
    expect(attackLootOf('lowlands', 6, partyOf(6, 0), smallCarry)).toEqual({
      ...noLoot,
      wood: 20,
      food: 20,
      gold: 20,
    })
  })

  it('brings nothing from a lost battle', () => {
    expect(attackLootOf('ridges', 15, partyOf(0, 0), shippedTerms)).toEqual(noLoot)
  })

  it('caps the attack loot at the survivors summed carry', () => {
    expect(attackLootOf('uplands', 6, partyOf(0, 1), shippedTerms)).toEqual({
      ...noLoot,
      wood: 40,
      stone: 40,
      gold: 40,
    })
    expect(attackLootOf('uplands', 15, partyOf(2, 6), shippedTerms)).toEqual({
      ...noLoot,
      wood: 272,
      stone: 272,
      gold: 272,
    })
    expect(attackLootOf('uplands', 6, partyOf(0, 9), shippedTerms)).toEqual({
      ...noLoot,
      wood: 120,
      stone: 120,
      gold: 120,
    })
  })
})

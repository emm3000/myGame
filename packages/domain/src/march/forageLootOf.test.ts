import { describe, expect, it } from 'vitest'
import type { MarchTerms } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { forageLootOf } from './forageLootOf'

const noLoot = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const unscaled = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const partyOf = (infantry: number, cavalry: number): UnitCountsByKind => ({
  infantry,
  cavalry,
  archer: 0,
  settler: 0,
})

const shippedTerms: MarchTerms = { forage: plainForage, units: plainUnits }

const carryOf = (carry: number): MarchTerms => ({
  ...shippedTerms,
  units: { ...plainUnits, infantry: { ...plainUnits.infantry, carry } },
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

const partyWithArchersOf = (
  infantry: number,
  cavalry: number,
  archer: number,
): UnitCountsByKind => ({
  infantry,
  cavalry,
  archer,
  settler: 0,
})

describe('forageLootOf', () => {
  it('forages food and wood on the lowlands', () => {
    expect(forageLootOf('lowlands', partyOf(1, 0), 1, shippedTerms, unscaled)).toEqual({
      ...noLoot,
      food: 3,
      wood: 3,
    })
  })

  it('forages wood and stone on the uplands', () => {
    expect(forageLootOf('uplands', partyOf(10, 0), 2, shippedTerms, unscaled)).toEqual({
      ...noLoot,
      wood: 60,
      stone: 60,
    })
  })

  it('caps each foraged resource at an even share of the carry', () => {
    expect(forageLootOf('uplands', partyOf(1, 0), 1, carryOf(4), unscaled)).toEqual({
      ...noLoot,
      wood: 2,
      stone: 2,
    })
    expect(forageLootOf('uplands', partyOf(10, 0), 8, shippedTerms, unscaled)).toEqual({
      ...noLoot,
      wood: 240,
      stone: 240,
    })
  })

  it('caps the forage at the carry the unit terms give', () => {
    expect(forageLootOf('uplands', partyOf(2, 0), 8, carryOf(10), unscaled)).toEqual({
      ...noLoot,
      wood: 10,
      stone: 10,
    })
  })

  it('never forages gold', () => {
    expect(forageLootOf('ridges', partyOf(10, 0), 8, goldOnTheRidges, unscaled)).toEqual({
      ...noLoot,
      stone: 240,
      iron: 240,
    })
  })

  it('forages one rate per head whatever the kind', () => {
    expect(forageLootOf('uplands', partyOf(12, 6), 2, shippedTerms, unscaled)).toEqual({
      ...noLoot,
      wood: 108,
      stone: 108,
    })
  })

  it('caps the forage at the carry summed over the kinds', () => {
    const richUplands: MarchTerms = {
      ...shippedTerms,
      forage: {
        ...plainForage,
        yieldPerHour: {
          ...plainForage.yieldPerHour,
          uplands: { ...noLoot, wood: 500, stone: 500 },
        },
      },
    }
    expect(forageLootOf('uplands', partyOf(1, 1), 1, richUplands, unscaled)).toEqual({
      ...noLoot,
      wood: 84,
      stone: 84,
    })
  })

  it('scales each foraged resource by its season percent', () => {
    expect(
      forageLootOf('lowlands', partyOf(12, 0), 2, shippedTerms, { ...unscaled, food: 125 }),
    ).toEqual({ ...noLoot, wood: 72, food: 90 })
    expect(
      forageLootOf('lowlands', partyOf(12, 0), 2, shippedTerms, { ...unscaled, food: 75 }),
    ).toEqual({ ...noLoot, wood: 72, food: 54 })
  })

  it('caps the scaled forage at the carry share', () => {
    expect(
      forageLootOf('lowlands', partyOf(10, 0), 8, shippedTerms, { ...unscaled, food: 125 }),
    ).toEqual({ ...noLoot, wood: 240, food: 240 })
  })

  it('never forages gold whatever its percent', () => {
    expect(
      forageLootOf('ridges', partyOf(10, 0), 1, goldOnTheRidges, { ...unscaled, gold: 125 }),
    ).toEqual({ ...noLoot, stone: 30, iron: 30 })
  })

  it('forages one rate per archer', () => {
    expect(
      forageLootOf('uplands', partyWithArchersOf(0, 0, 10), 2, shippedTerms, unscaled),
    ).toEqual({
      ...noLoot,
      wood: 60,
      stone: 60,
    })
  })

  it('caps the forage at the archers carry', () => {
    expect(
      forageLootOf('uplands', partyWithArchersOf(0, 0, 10), 8, shippedTerms, unscaled),
    ).toEqual({
      ...noLoot,
      wood: 120,
      stone: 120,
    })
    expect(
      forageLootOf('uplands', partyWithArchersOf(12, 0, 10), 8, shippedTerms, unscaled),
    ).toEqual({
      ...noLoot,
      wood: 408,
      stone: 408,
    })
  })
})

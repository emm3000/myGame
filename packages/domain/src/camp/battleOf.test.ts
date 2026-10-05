import { describe, expect, it } from 'vitest'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { plainUnits } from '../testing/plainUnits'
import { battleOf } from './battleOf'

const partyOf = (infantry: number, cavalry: number): UnitCountsByKind => ({
  infantry,
  cavalry,
  archer: 0,
  settler: 0,
})

describe('battleOf', () => {
  it('wins when the infantry are stronger', () => {
    expect(battleOf(partyOf(10, 0), 6, plainUnits)).toEqual({
      won: true,
      unitsLost: partyOf(4, 0),
      campLost: 6,
      survivors: partyOf(6, 0),
    })
  })

  it('gives a tie to the camp', () => {
    expect(battleOf(partyOf(6, 0), 6, plainUnits)).toEqual({
      won: false,
      unitsLost: partyOf(6, 0),
      campLost: 5,
      survivors: partyOf(0, 0),
    })
  })

  it('lets a defending camp lose strength by the same curve', () => {
    expect(battleOf(partyOf(12, 0), 15, plainUnits).campLost).toBe(10)
  })

  it('keeps the infantry battle as shipped', () => {
    expect(battleOf(partyOf(10, 0), 6, plainUnits).unitsLost).toEqual(partyOf(4, 0))
    expect(battleOf(partyOf(25, 0), 10, plainUnits).unitsLost).toEqual(partyOf(4, 0))
    expect(battleOf(partyOf(41, 0), 40, plainUnits)).toMatchObject({
      won: true,
      survivors: partyOf(1, 0),
    })
  })

  it('takes the losses from the infantry first', () => {
    expect(battleOf(partyOf(5, 5), 6, plainUnits).unitsLost).toEqual(partyOf(3, 0))
  })

  it('takes the rest from the riders at their strength', () => {
    expect(battleOf(partyOf(2, 3), 6, plainUnits)).toMatchObject({
      unitsLost: partyOf(2, 2),
      survivors: partyOf(0, 1),
    })
  })

  it('always leaves the winner one unit', () => {
    expect(battleOf(partyOf(1, 1), 2, plainUnits)).toMatchObject({
      won: true,
      unitsLost: partyOf(1, 0),
      survivors: partyOf(0, 1),
    })
    expect(battleOf(partyOf(0, 8), 15, plainUnits)).toMatchObject({
      won: true,
      unitsLost: partyOf(0, 7),
      survivors: partyOf(0, 1),
    })
    expect(battleOf(partyOf(0, 1), 1, plainUnits)).toEqual({
      won: true,
      unitsLost: partyOf(0, 0),
      campLost: 1,
      survivors: partyOf(0, 1),
    })
  })

  it('sums the strength over the kinds', () => {
    expect(battleOf(partyOf(0, 3), 6, plainUnits)).toEqual({
      won: false,
      unitsLost: partyOf(0, 3),
      campLost: 5,
      survivors: partyOf(0, 0),
    })
  })

  it('loses every unit against a stronger camp', () => {
    expect(battleOf(partyOf(0, 7), 15, plainUnits)).toEqual({
      won: false,
      unitsLost: partyOf(0, 7),
      campLost: 14,
      survivors: partyOf(0, 0),
    })
  })
})

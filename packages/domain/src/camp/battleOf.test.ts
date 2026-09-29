import { describe, expect, it } from 'vitest'
import { battleOf } from './battleOf'

const infantryStrength = 1

describe('battleOf', () => {
  it('wins when the infantry are stronger', () => {
    expect(battleOf(10, 6, infantryStrength)).toEqual({
      won: true,
      infantryLost: 4,
      campLost: 6,
      survivors: 6,
    })
  })

  it('gives a tie to the camp', () => {
    expect(battleOf(6, 6, infantryStrength)).toEqual({
      won: false,
      infantryLost: 6,
      campLost: 5,
      survivors: 0,
    })
  })

  it('lets a defending camp lose strength by the same curve', () => {
    expect(battleOf(12, 15, infantryStrength).campLost).toBe(10)
  })

  it('always leaves the winner one', () => {
    expect(battleOf(41, 40, infantryStrength)).toMatchObject({ won: true, survivors: 1 })
  })

  it('counts the losses in integers', () => {
    expect(battleOf(25, 10, infantryStrength).infantryLost).toBe(4)
  })
})

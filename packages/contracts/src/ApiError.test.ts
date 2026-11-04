import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from './index'

describe('ApiErrorSchema', () => {
  it('parses a kind without fields as the kind alone', () => {
    const insufficientResources = { kind: 'InsufficientResources' }

    expect(ApiErrorSchema.parse(insufficientResources)).toEqual(insufficientResources)
  })

  it('parses the refusal of a blank fief name', () => {
    const blankFiefName = { kind: 'BlankFiefName' }

    expect(ApiErrorSchema.parse(blankFiefName)).toEqual(blankFiefName)
  })

  it('rejects a message on the wire', () => {
    const queueFull = { kind: 'QueueFull', message: 'Ya no caben más obras en espera.' }

    expect(ApiErrorSchema.safeParse(queueFull).success).toBe(false)
  })

  it('rejects params on a kind without fields', () => {
    const queueFull = { kind: 'QueueFull', params: { cap: 3 } }

    expect(ApiErrorSchema.safeParse(queueFull).success).toBe(false)
  })

  it('parses a stay out of range with its longest stay', () => {
    const stayOutOfRange = { kind: 'StayOutOfRange', params: { maxStayHours: 8 } }

    expect(ApiErrorSchema.parse(stayOutOfRange)).toEqual(stayOutOfRange)
  })

  it('parses a party short at home with its unit and both counts', () => {
    const unitsShort = {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'cavalry', count: 7, atHome: 6 },
    }

    expect(ApiErrorSchema.parse(unitsShort)).toEqual(unitsShort)
  })

  it('parses a barracks too low with the unit and the level it requires', () => {
    const barracksTooLow = {
      kind: 'BarracksTooLow',
      params: { unit: 'settler', requiredBarracksLevel: 5 },
    }

    expect(ApiErrorSchema.parse(barracksTooLow)).toEqual(barracksTooLow)
  })

  it('parses a fief cap with the cap', () => {
    const fiefCapReached = { kind: 'FiefCapReached', params: { cap: 2 } }

    expect(ApiErrorSchema.parse(fiefCapReached)).toEqual(fiefCapReached)
  })

  it('parses a cargo above the carry with both amounts', () => {
    const cargoAboveCarry = { kind: 'CargoAboveCarry', params: { cargo: 721, carry: 720 } }

    expect(ApiErrorSchema.parse(cargoAboveCarry)).toEqual(cargoAboveCarry)
  })

  it('rejects a slotted kind without its params', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'StayOutOfRange' }).success).toBe(false)
  })

  it('rejects a fractional longest stay', () => {
    const stayOutOfRange = { kind: 'StayOutOfRange', params: { maxStayHours: 7.5 } }

    expect(ApiErrorSchema.safeParse(stayOutOfRange).success).toBe(false)
  })

  it('rejects a party short at home naming an unknown unit', () => {
    const unitsShort = {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'pikeman', count: 7, atHome: 6 },
    }

    expect(ApiErrorSchema.safeParse(unitsShort).success).toBe(false)
  })

  it('rejects an unknown kind', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'QueueBusy' }).success).toBe(false)
  })
})

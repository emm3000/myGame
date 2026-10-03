import { describe, expect, it } from 'vitest'
import { DispatchTransportRequestSchema } from './index'

const transportToTheOtherFief = {
  toFiefId: '6f1c2a5e-3b7d-4c8e-9a10-2b3c4d5e6f70',
  units: { infantry: 0, cavalry: 6, settler: 0 },
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
}

describe('DispatchTransportRequestSchema', () => {
  it('parses the destination, the party and the cargo of a transport', () => {
    expect(DispatchTransportRequestSchema.parse(transportToTheOtherFief)).toEqual(
      transportToTheOtherFief,
    )
  })

  it('rejects a transport that names a plot', () => {
    expect(
      DispatchTransportRequestSchema.safeParse({ ...transportToTheOtherFief, province: 2 }).success,
    ).toBe(false)
  })

  it('rejects a destination that is not a fief id', () => {
    expect(
      DispatchTransportRequestSchema.safeParse({ ...transportToTheOtherFief, toFiefId: 'fief-2' })
        .success,
    ).toBe(false)
  })

  it('rejects a fractional amount of the cargo', () => {
    expect(
      DispatchTransportRequestSchema.safeParse({
        ...transportToTheOtherFief,
        cargo: { ...transportToTheOtherFief.cargo, wood: 0.5 },
      }).success,
    ).toBe(false)
  })

  it('rejects a transport without a party', () => {
    expect(
      DispatchTransportRequestSchema.safeParse({
        ...transportToTheOtherFief,
        units: { infantry: 0, cavalry: 0, settler: 0 },
      }).success,
    ).toBe(false)
  })
})

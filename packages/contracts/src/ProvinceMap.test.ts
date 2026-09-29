import { describe, expect, it } from 'vitest'
import { ProvinceMapSchema } from './index'

const provinceWith = (plots: ReadonlyArray<unknown>) => ({
  kingdom: 1,
  province: 1,
  lastProvince: 2,
  terrain: 'lowlands',
  plots,
})

describe('ProvinceMapSchema', () => {
  it('parses a province of held and free plots', () => {
    const province = provinceWith([
      { plot: 1, fief: { name: 'Valdehierro', isOwn: true }, camp: null },
      { plot: 2, fief: { name: 'Robledal', isOwn: false }, camp: null },
      { plot: 3, fief: null, camp: null },
    ])

    expect(ProvinceMapSchema.parse(province)).toEqual(province)
  })

  it('rejects a held plot without a fief name', () => {
    const province = provinceWith([{ plot: 1, fief: { isOwn: false }, camp: null }])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a plot that carries a player id', () => {
    const province = provinceWith([
      { plot: 1, fief: { name: 'Robledal', isOwn: false }, camp: null, playerId: 'player-2' },
    ])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a held fief that carries a player id', () => {
    const province = provinceWith([
      { plot: 1, fief: { name: 'Robledal', isOwn: false, playerId: 'player-2' }, camp: null },
    ])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a map that carries the viewer id', () => {
    const province = {
      ...provinceWith([{ plot: 1, fief: null, camp: null }]),
      playerId: 'player-1',
    }

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('accepts a plot with no camp', () => {
    const province = provinceWith([{ plot: 1, fief: null, camp: null }])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(true)
  })

  it('parses a free plot with a camp', () => {
    const province = provinceWith([{ plot: 7, fief: null, camp: { tier: 2, strength: 0 } }])

    expect(ProvinceMapSchema.parse(province)).toEqual(province)
  })

  it('rejects a camp of tier 4', () => {
    const province = provinceWith([{ plot: 7, fief: null, camp: { tier: 4, strength: 15 } }])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a camp of a fractional strength', () => {
    const province = provinceWith([{ plot: 7, fief: null, camp: { tier: 1, strength: 2.5 } }])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a plot without its camp field', () => {
    const province = provinceWith([{ plot: 1, fief: null }])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })
})

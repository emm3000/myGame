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
      { plot: 1, fief: { name: 'Valdehierro', isOwn: true } },
      { plot: 2, fief: { name: 'Robledal', isOwn: false } },
      { plot: 3, fief: null },
    ])

    expect(ProvinceMapSchema.parse(province)).toEqual(province)
  })

  it('rejects a held plot without a fief name', () => {
    const province = provinceWith([{ plot: 1, fief: { isOwn: false } }])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a plot that carries a player id', () => {
    const province = provinceWith([
      { plot: 1, fief: { name: 'Robledal', isOwn: false }, playerId: 'player-2' },
    ])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a held fief that carries a player id', () => {
    const province = provinceWith([
      { plot: 1, fief: { name: 'Robledal', isOwn: false, playerId: 'player-2' } },
    ])

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })

  it('rejects a map that carries the viewer id', () => {
    const province = { ...provinceWith([{ plot: 1, fief: null }]), playerId: 'player-1' }

    expect(ProvinceMapSchema.safeParse(province).success).toBe(false)
  })
})

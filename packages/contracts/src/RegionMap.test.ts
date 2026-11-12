import { describe, expect, it } from 'vitest'
import { RegionMapSchema } from './index'

const map = {
  region: 1,
  area: 2,
  lastArea: 3,
  terrain: 'river',
  sites: [
    { site: 1, town: { name: 'Maple Falls', isOwn: true }, waste: null },
    { site: 2, town: { name: 'Cedar Point', isOwn: false }, waste: null },
    { site: 3, town: null, waste: null },
    { site: 4, town: null, waste: { size: 3, waste: 12 } },
  ],
}

describe('RegionMapSchema', () => {
  it('parses an area with free sites, a waste site, a neighbor and the own town', () => {
    expect(RegionMapSchema.parse(map)).toEqual(map)
  })

  it('rejects a site that names its holder', () => {
    const sites = [
      { site: 1, town: { name: 'Maple Falls', isOwn: false, playerId: 'p' }, waste: null },
    ]

    expect(RegionMapSchema.safeParse({ ...map, sites }).success).toBe(false)
  })

  it('rejects a terrain the town does not know', () => {
    expect(RegionMapSchema.safeParse({ ...map, terrain: 'forest' }).success).toBe(false)
  })

  it('rejects a waste size the town does not know', () => {
    const sites = [{ site: 4, town: null, waste: { size: 4, waste: 12 } }]

    expect(RegionMapSchema.safeParse({ ...map, sites }).success).toBe(false)
  })

  it('rejects a fractional waste', () => {
    const sites = [{ site: 4, town: null, waste: { size: 1, waste: 2.5 } }]

    expect(RegionMapSchema.safeParse({ ...map, sites }).success).toBe(false)
  })
})

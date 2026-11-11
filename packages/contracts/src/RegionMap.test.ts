import { describe, expect, it } from 'vitest'
import { RegionMapSchema } from './index'

const map = {
  region: 1,
  area: 2,
  lastArea: 3,
  terrain: 'river',
  sites: [
    { site: 1, town: { name: 'Maple Falls', isOwn: true } },
    { site: 2, town: { name: 'Cedar Point', isOwn: false } },
    { site: 3, town: null },
  ],
}

describe('RegionMapSchema', () => {
  it('parses an area with free sites, a neighbor and the own town', () => {
    expect(RegionMapSchema.parse(map)).toEqual(map)
  })

  it('rejects a site that names its holder', () => {
    const sites = [{ site: 1, town: { name: 'Maple Falls', isOwn: false, playerId: 'p' } }]

    expect(RegionMapSchema.safeParse({ ...map, sites }).success).toBe(false)
  })

  it('rejects a terrain the town does not know', () => {
    expect(RegionMapSchema.safeParse({ ...map, terrain: 'forest' }).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import type { PlotAddress } from '../fief/PlotAddress'
import { plainCamps } from '../testing/plainCamps'
import type { CampTier } from './CampTier'
import { campOf } from './campOf'

const firstHundredProvinces = (): ReadonlyArray<PlotAddress> =>
  Array.from({ length: 100 }, (_, provinceIndex) =>
    Array.from({ length: 15 }, (_, plotIndex) => ({
      kingdom: 1,
      province: provinceIndex + 1,
      plot: plotIndex + 1,
    })),
  ).flat()

const campTiersOf = (addresses: ReadonlyArray<PlotAddress>): ReadonlyArray<CampTier> =>
  addresses.flatMap((address) => {
    const camp = campOf(address, plainCamps)
    return camp === undefined ? [] : [camp.tier]
  })

describe('campOf', () => {
  it('places the same camp on every call for one plot', () => {
    const plots = firstHundredProvinces()

    expect(campTiersOf(plots)).toEqual(campTiersOf(plots))
  })

  it('places camps on about the content fraction of the plots', () => {
    const camps = campTiersOf(firstHundredProvinces()).length

    expect(camps).toBeGreaterThanOrEqual(255)
    expect(camps).toBeLessThanOrEqual(345)
  })

  it('draws every tier', () => {
    const tiers = campTiersOf(firstHundredProvinces())
    const shareOf = (tier: CampTier): number =>
      tiers.filter((drawn) => drawn === tier).length / tiers.length

    for (const tier of [1, 2, 3] as const) {
      expect(shareOf(tier)).toBeGreaterThanOrEqual(0.25)
      expect(shareOf(tier)).toBeLessThanOrEqual(0.42)
    }
  })

  it('places no camp at a fraction of 0', () => {
    const noCamps = { ...plainCamps, campFraction: 0 }

    expect(
      firstHundredProvinces().filter((address) => campOf(address, noCamps) !== undefined),
    ).toEqual([])
  })
})

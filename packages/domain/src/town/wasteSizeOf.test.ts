import { describe, expect, it } from 'vitest'
import { plainTownSettings } from '../testing/townCatalogOf'
import type { SiteAddress } from './SiteAddress'
import type { WasteTerms } from './TownSettings'
import { wasteSizeOf } from './wasteSizeOf'

const wasteTerms = plainTownSettings.waste

const withFraction = (siteFraction: number): WasteTerms => ({ ...wasteTerms, siteFraction })

const sitesOfRegionOne: ReadonlyArray<SiteAddress> = Array.from({ length: 200 }, (_, areaIndex) =>
  Array.from({ length: 15 }, (_, siteIndex) => ({
    region: 1,
    area: areaIndex + 1,
    site: siteIndex + 1,
  })),
).flat()

const wasteSitesAmong = (terms: WasteTerms): ReadonlyArray<SiteAddress> =>
  sitesOfRegionOne.filter((site) => wasteSizeOf(site, terms) !== undefined)

describe('wasteSizeOf', () => {
  it("places waste on the content's fraction of free sites by the address's hash", () => {
    const share = wasteSitesAmong(wasteTerms).length / sitesOfRegionOne.length

    expect(share).toBeGreaterThan(0.18)
    expect(share).toBeLessThan(0.22)
  })

  it('places waste from no site at a fraction of 0 to every site at 1', () => {
    expect([
      wasteSitesAmong(withFraction(0)).length,
      wasteSitesAmong(withFraction(1)).length,
    ]).toEqual([0, sitesOfRegionOne.length])
  })

  it('gives each waste site one of three sizes', () => {
    const sizes = sitesOfRegionOne.map((site) => wasteSizeOf(site, withFraction(1)))
    const countOf = (size: number): number => sizes.filter((placed) => placed === size).length

    expect(new Set(sizes)).toEqual(new Set([1, 2, 3]))
    expect([countOf(1), countOf(2), countOf(3)].every((count) => count > 900)).toBe(true)
  })
})

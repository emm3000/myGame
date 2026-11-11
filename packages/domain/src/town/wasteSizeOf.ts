import { mixed32 } from '../hash/mixed32'
import type { SiteAddress } from './SiteAddress'
import type { WasteTerms } from './TownSettings'
import type { WasteSize } from './WasteSize'

const PLACEMENT_RANGE = 2 ** 24

const SIZE_BITS = 0xff

const SIZES_IN_ROTATION = 3

const siteHashOf = ({ region, area, site }: SiteAddress): number =>
  mixed32(mixed32(mixed32(region) ^ area) ^ site)

const sizeOf = (hash: number): WasteSize => {
  const positionInRotation = (hash & SIZE_BITS) % SIZES_IN_ROTATION
  if (positionInRotation === 0) {
    return 1
  }
  return positionInRotation === 1 ? 2 : 3
}

export const wasteSizeOf = (site: SiteAddress, terms: WasteTerms): WasteSize | undefined => {
  const hash = siteHashOf(site)
  const placement = hash >>> 8
  return placement < terms.siteFraction * PLACEMENT_RANGE ? sizeOf(hash) : undefined
}

import type { PlotAddress } from '../fief/PlotAddress'
import type { CampTerms } from '../ports/BuildingCatalog'
import type { CampTier } from './CampTier'

const PLACEMENT_RANGE = 2 ** 24
const TIER_BITS = 0xff
const TIERS_IN_ROTATION = 3

const mixed = (value: number): number => {
  const first = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  const second = Math.imul(first ^ (first >>> 15), 0x846ca68b)
  return (second ^ (second >>> 16)) >>> 0
}

const plotHashOf = ({ kingdom, province, plot }: PlotAddress): number =>
  mixed(mixed(mixed(kingdom) ^ province) ^ plot)

const tierOf = (hash: number): CampTier => {
  const positionInRotation = (hash & TIER_BITS) % TIERS_IN_ROTATION
  if (positionInRotation === 0) {
    return 1
  }
  if (positionInRotation === 1) {
    return 2
  }
  return 3
}

export const campOf = (
  address: PlotAddress,
  camps: CampTerms,
): { readonly tier: CampTier } | undefined => {
  const hash = plotHashOf(address)
  const placement = hash >>> 8
  if (placement >= camps.campFraction * PLACEMENT_RANGE) {
    return undefined
  }
  return { tier: tierOf(hash) }
}

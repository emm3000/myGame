import type { Terrain } from './Terrain'
import type { WasteSize } from './WasteSize'

export type SiteWaste = {
  readonly size: WasteSize
  readonly waste: number
}

export type RegionSite = {
  readonly site: number
  readonly town: { readonly name: string; readonly isOwn: boolean } | undefined
  readonly waste: SiteWaste | undefined
}

export type RegionMap = {
  readonly region: number
  readonly area: number
  readonly lastArea: number
  readonly terrain: Terrain
  readonly sites: ReadonlyArray<RegionSite>
}

import type { Terrain } from './Terrain'

export type RegionSite = {
  readonly site: number
  readonly town: { readonly name: string; readonly isOwn: boolean } | undefined
}

export type RegionMap = {
  readonly region: number
  readonly area: number
  readonly lastArea: number
  readonly terrain: Terrain
  readonly sites: ReadonlyArray<RegionSite>
}

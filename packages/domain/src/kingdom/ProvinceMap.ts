import type { CampTier } from '../camp/CampTier'
import type { Terrain } from '../fief/Terrain'

export type ProvincePlot = {
  readonly plot: number
  readonly fief: { readonly name: string; readonly isOwn: boolean } | undefined
  readonly camp: { readonly tier: CampTier; readonly strength: number } | undefined
}

export type ProvinceMap = {
  readonly kingdom: number
  readonly province: number
  readonly lastProvince: number
  readonly terrain: Terrain
  readonly plots: ReadonlyArray<ProvincePlot>
}
